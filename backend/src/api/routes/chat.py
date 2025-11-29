"""
Chat route module for handling chat API endpoints.
Provides streaming chat functionality.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import AsyncGenerator, List
from src.services.ai_service import ai_service
from src.api.deps import get_current_user


router = APIRouter()


class Message(BaseModel):
    """Message model for chat history."""
    role: str = Field(..., description="Role of the message sender (user, assistant, system)")
    content: str = Field(..., description="Content of the message")


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    messages: List[Message] = Field(..., description="Chat history including the latest user message")


class ChatResponse(BaseModel):
    """Response model for chat endpoint (for documentation purposes)."""
    response: str = Field(..., description="AI generated response")


async def generate_stream(messages: List[Message], user_id: str) -> AsyncGenerator[str, None]:
    """
    Generate Server-Sent Events (SSE) formatted stream.
    
    Args:
        messages: The chat history including the latest user message
        user_id: The authenticated user ID
        
    Yields:
        SSE formatted data chunks
    """
    try:
        # Convert Pydantic models to dicts or keep as is, depending on service expectation
        # Here passing the list of Message objects
        async for chunk in ai_service.generate_response(messages, user_id):
            # Format as Server-Sent Events
            yield f"data: {chunk}\n\n"
        
        # Send done signal
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        error_message = f"Error in stream: {str(e)}"
        print(error_message)
        yield f"data: [ERROR]: {str(e)}\n\n"


@router.post("/chat")
async def chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user)
) -> StreamingResponse:
    """
    Chat endpoint that streams responses from the AI model.
    Protected endpoint: Requires valid JWT token.
    
    Args:
        request: ChatRequest containing the chat history
        user_id: The authenticated user ID (extracted from token)
        
    Returns:
        StreamingResponse with text/event-stream media type
        
    Raises:
        HTTPException: If the request is invalid or processing fails
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty")
    
    return StreamingResponse(
        generate_stream(request.messages, user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )
