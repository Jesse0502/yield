"""
File upload routes for RAG ingestion.

Endpoints:
- POST /api/files/upload : Upload a file, store it in Supabase Storage, and index its contents into memories.
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from src.api.deps import get_current_user
from src.services.file_ingestion import ingest_file_to_memory, BUCKET_NAME

router = APIRouter()


@router.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    try:
        result = await ingest_file_to_memory(user_id, file)
        return {
            "message": "File uploaded and indexed successfully.",
            "bucket": BUCKET_NAME,
            **result,
        }
    except Exception as e:
        print(f"Error ingesting file: {e}")
        raise HTTPException(status_code=500, detail=str(e))




