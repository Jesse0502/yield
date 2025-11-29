"""
Memories route module for handling memory bank operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from src.api.deps import get_current_user
from src.services.tools import add_memory, search_memory, delete_memory
from src.db.client import supabase

router = APIRouter()

class CreateMemoryRequest(BaseModel):
    content: str

class SearchMemoryRequest(BaseModel):
    query: str

@router.post("/memories")
async def create_memory(
    request: CreateMemoryRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Add a new memory manually.
    """
    print(f"Creating memory for user {user_id}: {request.content}")
    try:
        # Re-using the tool logic directly
        # Note: calling .invoke or .ainvoke on a tool passes arguments to the function
        result = await add_memory.ainvoke({"content": request.content, "user_id": user_id})
        
        print(f"Add memory result: {result}")
        
        if "Error" in result or "Failed" in result or "✗" in result:
             # Basic check, though tool returns string. 
             raise HTTPException(status_code=500, detail=result)
             
        return {"message": result}
    except Exception as e:
        print(f"Error creating memory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/memories")
async def get_memories(
    query: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    user_id: str = Depends(get_current_user)
):
    """
    Get or search memories.
    If query is provided, performs vector search.
    If not, lists recent memories.
    """
    try:
        if query:
            # Use vector search tool logic (but return raw data)
            from src.services.tools import embeddings
            query_embedding = await embeddings.aembed_query(query)
            
            response = supabase.rpc(
                "match_memories",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.5,
                    "match_count": limit,
                    "p_user_id": user_id
                }
            ).execute()
            
            return response.data
            
        else:
            # List recent memories (standard DB query)
            response = supabase.table("memories") \
                .select("*") \
                .eq("user_id", user_id) \
                .order("created_at", desc=True) \
                .range(offset, offset + limit - 1) \
                .execute()
                
            return response.data
            
    except Exception as e:
        print(f"Error fetching memories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/memories/{memory_id}")
async def delete_user_memory(
    memory_id: str,
    user_id: str = Depends(get_current_user)
):
    """Delete a memory."""
    try:
        result = await delete_memory.ainvoke({"memory_id": memory_id, "user_id": user_id})
        return {"message": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
