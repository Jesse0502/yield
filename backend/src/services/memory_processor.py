"""
Memory Processor Service
Centralized service for handling all memory operations (Add/Delete) in the background.
"""
import json
import asyncio
import logging
from typing import List, Dict, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_xai import ChatXAI
from src.core.config import settings
from src.services.tools import add_memory, delete_memory, search_memory, embeddings as embed_model
from src.db.client import supabase

logger = logging.getLogger("yield.services.memory_processor")

class MemoryProcessor:
    def __init__(self):
        # Initialize a dedicated model instance for extraction/decision making
        self.extractor_model = ChatXAI(
            model="grok-3",
            temperature=0.7, # Low temp for structured output
            xai_api_key=settings.xai_api_key,
        )
        
        self.system_prompt = """You are the Memory Manager. Your job is to manage the user's long-term memory database.
You will receive the latest user utterance along with the most recent conversation context.
Carefully resolve pronouns or vague references using that context before deciding what to do.

Analyze the user's latest message (with context) and determine if we need to SAVE a new fact or DELETE an existing one.

**Supported Intents:**
1. `SAVE`: The user shares new personal information (e.g., "I like pizza", "My name is John, I like Ariana Grande's music").
   - Convert first-person ("I") to third-person ("The user").
   - Split compound facts into atomic strings.
   - Facts must include the resolved entity ("Ariana Grande") instead of vague references ("her").
   
2. `DELETE`: The user explicitly asks to forget/remove something (e.g., "Forget that I like pizza", "Delete my name").
   - Extract the specific TOPIC or FACT they want to remove.

3. `NONE`: The user is just chatting, asking questions, greeting, or referencing short-term context.

**Output Format (JSON):**
{
    "intent": "SAVE" | "DELETE" | "NONE",
    "facts": ["The user likes pizza", "The user lives in NYC"],  // Required for SAVE
    "query": "user likes pizza"                                  // Required for DELETE
}

Always favor clarity over brevity. If context says "Ariana Grande" and the latest line says "I like her music", convert to "The user likes Ariana Grande's music."
"""

    async def process_message(
        self,
        user_message: str,
        user_id: str,
        context_messages: Optional[List[Dict[str, str]]] = None,
    ):
        """
        Analyzes message intent and performs Add or Delete operations.
        Running in background.
        """
        try:
            context_text = self._format_context(context_messages)
            human_payload = f"CONTEXT:\n{context_text}\n\nLATEST_USER_MESSAGE:\n{user_message.strip()}"

            # 1. Analyze Intent
            messages = [
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=human_payload)
            ]
            response = await self.extractor_model.ainvoke(messages)
            content = response.content.strip()

            # Clean markdown if present
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
            
            # Parse JSON
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                logger.warning("Memory processor failed to parse JSON response: %s", content)
                return

            intent = data.get("intent", "NONE")

            # 2. Handle SAVE
            if intent == "SAVE":
                facts = data.get("facts", [])
                if facts:
                    logger.info("Saving %s extracted facts for user %s", len(facts), user_id)
                    for fact in facts:
                        await add_memory.ainvoke({"content": fact, "user_id": user_id})
                        logger.debug("Saved fact for user %s: %s", user_id, fact)

            # 3. Handle DELETE
            elif intent == "DELETE":
                query = data.get("query")
                if query:
                    logger.info("Deleting memories about '%s' for user %s", query, user_id)
                    await self._handle_deletion(query, user_id)

        except Exception as e:
            logger.exception("Memory processor failed for user %s", user_id)

    async def _handle_deletion(self, query: str, user_id: str):
        """
        Helper to find and delete memories matching a query.
        """
        try:
            # Step 1: Search for the memory ID(s)
            # We generate the embedding manually and call Supabase directly for precision
            query_embedding = await embed_model.aembed_query(query)
            
            # Call match_memories RPC
            # We use a HIGH threshold (0.85) to ensure we don't accidentally delete unrelated things
            response = supabase.rpc(
                "match_memories",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.85, 
                    "match_count": 10,
                    "p_user_id": user_id
                }
            ).execute()
            
            matches = response.data
            
            if not matches:
                logger.info("No high-confidence matches found for deletion query '%s' (user %s)", query, user_id)
                return

            # Step 2: Delete found matches
            for match in matches:
                mem_id = match['id']
                content = match['content']
                similarity = match.get('similarity', 0)
                
                logger.debug("Deleting memory %s for user %s (score=%.2f)", mem_id, user_id, similarity)
                await delete_memory.ainvoke({"memory_id": mem_id, "user_id": user_id})
                
        except Exception as e:
            logger.exception("Deletion logic failed for user %s and query '%s'", user_id, query)

    def _format_context(self, context_messages: Optional[List[Dict[str, str]]]) -> str:
        """Convert recent messages into a readable context block for the extractor."""
        if not context_messages:
            return "No prior context provided."

        formatted_lines: List[str] = []
        for msg in context_messages[-6:]:
            role = msg.get("role", "assistant")
            content = msg.get("content", "").strip()
            if not content:
                continue
            role_label = "User" if role == "user" else "Assistant"
            formatted_lines.append(f"{role_label}: {content}")

        return "\n".join(formatted_lines) if formatted_lines else "No prior context provided."

# Global instance
memory_processor = MemoryProcessor()
