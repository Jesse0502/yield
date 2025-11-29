"""
Memory Tools for the AI assistant.
Provides functionality to add, delete, and search memories using vector embeddings.
"""

import logging
from typing import List
from langchain_core.tools import tool
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from src.db.client import supabase
from src.core.config import settings
import uuid
from datetime import datetime, timedelta, timezone

logger = logging.getLogger("yield.services.tools")


# Initialize Google embeddings model
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    google_api_key=settings.google_api_key
)

# Initialize Supabase vector store
vector_store = SupabaseVectorStore(
    client=supabase,
    embedding=embeddings,
    table_name="memories",
    query_name="match_memories"  # RPC function for similarity search
)


@tool
async def add_memory(content: str, user_id: str = None) -> str:
    """
    Add a new memory to the memory bank.
    
    Args:
        content: The memory content to store
        user_id: The ID of the user (optional, injected by system)
    """
    if not user_id:
        return "Error: user_id is required"

    try:
        embedding = await embeddings.aembed_query(content)
        data = {
            "content": content,
            "embedding": embedding,
            "user_id": user_id,
            "metadata": {}
        }

        supabase.table("memories").insert(data).execute()
        logger.info("Stored memory for user %s (preview=%s...)", user_id, content[:40])
        return f"✓ Memory saved successfully! I'll remember that: '{content}'"
    except Exception as e:
        logger.exception("Failed to store memory for user %s", user_id)
        return f"✗ Failed to add memory: {str(e)}"


@tool
async def delete_memory(memory_id: str, user_id: str = None) -> str:
    """
    Delete a specific memory from the memory bank by its ID.
    
    Args:
        memory_id: The UUID of the memory to delete
        user_id: The ID of the user (optional, injected by system)
    """
    if not user_id:
        return "Error: user_id is required"

    try:
        result = supabase.table("memories").delete().eq("id", memory_id).eq("user_id", user_id).execute()
        if result.data:
            logger.info("Deleted memory %s for user %s", memory_id, user_id)
            return f"✓ Memory deleted successfully (ID: {memory_id})"
        logger.warning("Memory %s not found or access denied for user %s", memory_id, user_id)
        return f"✗ Memory not found or access denied (ID: {memory_id})"
    except Exception as e:
        logger.exception("Failed to delete memory %s for user %s", memory_id, user_id)
        return f"✗ Failed to delete memory: {str(e)}"


@tool
async def search_memory(query: str, user_id: str = None) -> str:
    """
    Search the memory bank for relevant information using semantic similarity.
    
    Args:
        query: The search query
        user_id: The ID of the user (optional, injected by system)
    """
    if not user_id:
        return "Error: user_id is required"

    try:
        query_embedding = await embeddings.aembed_query(query)
        response = supabase.rpc(
            "match_memories",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.5,
                "match_count": 5,
                "p_user_id": user_id
            }
        ).execute()

        docs = response.data

        if not docs:
            logger.info("No memories matched query for user %s", user_id)
            return "No relevant memories found for your query."

        results = []
        for i, doc in enumerate(docs, 1):
            content = doc.get('content')
            memory_id = doc.get('id', 'unknown')
            created_at_str = doc.get('created_at', '')

            date_str = "Unknown date"
            if created_at_str:
                try:
                    dt = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                    date_str = dt.strftime("%Y-%m-%d")
                except Exception:
                    date_str = created_at_str

            results.append(f"{i}. [{date_str}] {content} (ID: {memory_id})")

        logger.info("Found %s memory matches for user %s", len(results), user_id)
        return "Relevant memories found:\n" + "\n".join(results)

    except Exception as e:
        logger.exception("Failed to search memories for user %s", user_id)
        return f"✗ Failed to search memories: {str(e)}"


@tool
async def schedule_reminder(context: str, delay_hours: int, user_id: str = None) -> str:
    """
    Schedules a reminder or follow-up for the future.
    
    Args:
        context: What to remind the user about (e.g., "Ask how the concert went").
        delay_hours: How many hours from now to trigger the reminder.
        user_id: The ID of the user (optional, injected by system).
    """
    if not user_id:
        return "Error: user_id is required"
        
    try:
        trigger_at = datetime.now(timezone.utc) + timedelta(hours=delay_hours)
        data = {
            "user_id": user_id,
            "content": context,
            "trigger_at": trigger_at.isoformat(),
            "status": "pending"
        }
        
        supabase.table("reminders").insert(data).execute()
        logger.info("Scheduled reminder for user %s @ %s", user_id, trigger_at.isoformat())
        return f"✓ Reminder scheduled for {trigger_at.strftime('%Y-%m-%d %H:%M')} UTC: '{context}'"
        
    except Exception as e:
        logger.exception("Failed to schedule reminder for user %s", user_id)
        return f"✗ Failed to schedule reminder: {str(e)}"


# Export tools as a list for easy binding
memory_tools = [add_memory, delete_memory, search_memory, schedule_reminder]
