"""
Unified search endpoint for querying user content across memories, files, smart inbox, and chat history.
"""

from typing import Any, Dict, List, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.deps import get_current_user
from src.core.logging import get_logger
from src.db.client import supabase

router = APIRouter()
logger = get_logger("yield.api.search")


def _safe_query(description: str, query_fn):
    try:
        response = query_fn()
        return response.data or []
    except Exception as exc:
        logger.exception("Search %s query failed: %s", description, str(exc))
        return []


def _split_memory_results(
    rows: List[Dict[str, Any]],
    limit: int = 5,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Partition memory rows into standard memories vs. file-derived chunks."""
    memory_results: List[Dict[str, Any]] = []
    file_results: List[Dict[str, Any]] = []

    for row in rows:
        metadata = row.get("metadata") or {}
        entry = {
            "id": row.get("id"),
            "content": row.get("content", ""),
            "metadata": metadata,
            "createdAt": row.get("created_at"),
        }
        source = metadata.get("source")
        if source == "file":
            if len(file_results) < limit:
                file_results.append(
                    {
                        "id": row.get("id"),
                        "fileId": metadata.get("file_id") or row.get("id"),
                        "fileName": metadata.get("file_name") or "Uploaded file",
                        "storagePath": metadata.get("storage_path"),
                        "content": row.get("content", ""),
                        "createdAt": row.get("created_at"),
                        "chunkIndex": metadata.get("chunk_index"),
                    }
                )
        else:
            if len(memory_results) < limit:
                memory_results.append(entry)

    return memory_results[:limit], file_results[:limit]

@router.options("/search")
async def search_options():
    """Handle CORS preflight for search endpoint"""
    return {"message": "OK"}
@router.get("/search")
async def search_everything(
    q: str = Query("", min_length=0, max_length=200, description="Search term"),
    user_id: str = Depends(get_current_user),
):
    print(f"Search term--------------------------------: {q}")
    """
    Search across memories, uploaded file chunks, smart inbox notifications, and chat history.
    """
    # Validate query length (skip validation for OPTIONS requests or empty queries)
    try:
        if len(q.strip()) < 2:
            raise HTTPException(status_code=400, detail="Search term must be at least 2 characters long")

        term = f"%{q}%"
    

        logger.info(f"Search term: {term}")

        # Memories + File chunks (single query, partition client-side)
        memory_rows = _safe_query(
            "memories",
            lambda: supabase.table("memories")
            .select("id, content, metadata, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .ilike("content", term)
            .limit(40)
            .execute(),
        )
        memory_results, file_results = _split_memory_results(memory_rows)

        # Supplement file results by matching filenames
        if len(file_results) < 5:
            file_name_rows = _safe_query(
                "file-name",
                lambda: supabase.table("memories")
                .select("id, metadata, created_at")
                .eq("user_id", user_id)
                .filter("metadata->>source", "eq", "file")
                .filter("metadata->>file_name", "ilike", term)
                .limit(10)
                .execute(),
            )
            existing_ids = {item["fileId"] for item in file_results}
            for row in file_name_rows:
                metadata = row.get("metadata") or {}
                file_id = metadata.get("file_id") or row.get("id")
                if file_id in existing_ids:
                    continue
                file_results.append(
                    {
                        "id": row.get("id"),
                        "fileId": file_id,
                        "fileName": metadata.get("file_name") or "Uploaded file",
                        "storagePath": metadata.get("storage_path"),
                        "content": metadata.get("file_name") or "",
                        "createdAt": row.get("created_at"),
                        "chunkIndex": metadata.get("chunk_index"),
                    }
                )
                existing_ids.add(file_id)
                if len(file_results) >= 5:
                    break

        # Smart inbox notifications
        inbox_rows = _safe_query(
            "notifications",
            lambda: supabase.table("notifications")
            .select("id, type, content, is_read, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .ilike("content", term)
            .limit(10)
            .execute(),
        )
        inbox_results = [
            {
                "id": row.get("id"),
                "type": row.get("type"),
                "content": row.get("content", ""),
                "isRead": row.get("is_read", False),
                "createdAt": row.get("created_at"),
                "notificationId": row.get("id"),  # For deep linking
            }
            for row in inbox_rows
        ]

        # Chat history - search in past messages
        # Note: chat_history stores messages as JSON with {type: "human"/"ai", content: "..."}
        chat_rows = _safe_query(
            "chat_history",
            lambda: supabase.table("chat_history")
            .select("id, message, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(100)  # Fetch more to filter client-side
            .execute(),
        )
        # Filter and map chat results
        chat_results = []
        for row in chat_rows:
            message_data = row.get("message") or {}
            content = message_data.get("content", "")
            if term.replace("%", "").lower() in content.lower():
                message_type = message_data.get("type", "ai")
                role = "user" if message_type == "human" else "assistant"
                chat_results.append({
                    "id": str(row.get("id")),
                    "role": role,
                    "content": content,
                    "createdAt": row.get("created_at"),
                    "messageId": str(row.get("id")),  # For deep linking to specific message
                })
                if len(chat_results) >= 10:
                    break

        return {
            "query": q,
            "results": {
                "memories": memory_results,
                "files": file_results,
                "smartInbox": inbox_results,
                "chats": chat_results,
            },
        }
    except Exception as exc:
        logger.exception("Search query failed: %s", str(exc))
        raise HTTPException(status_code=500, detail="Failed to perform search")


