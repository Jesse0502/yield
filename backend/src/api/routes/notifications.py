"""
Notifications route module for handling user notifications.
"""

from fastapi import APIRouter, Depends, HTTPException
from src.api.deps import get_current_user
from src.db.client import supabase
from typing import List, Dict, Any

router = APIRouter()

@router.get("/notifications")
async def get_notifications(user_id: str = Depends(get_current_user)):
    """
    Get unread notifications for the current user.
    Protected endpoint: Requires valid JWT token.
    """
    try:
        # Fetch unread notifications for the user
        response = supabase.table("notifications") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("is_read", False) \
            .order("created_at", desc=True) \
            .execute()
            
        return response.data
    except Exception as e:
        print(f"Error fetching notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")

@router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, user_id: str = Depends(get_current_user)):
    """
    Delete (or mark as read) a notification.
    Protected endpoint: Requires valid JWT token.
    """
    try:
        # Check if notification belongs to user
        response = supabase.table("notifications") \
            .delete() \
            .eq("id", notification_id) \
            .eq("user_id", user_id) \
            .execute()
            
        if not response.data:
            # If no data returned, it might not exist or belong to user
            # Alternatively, could just mark as read: .update({"is_read": True})
            raise HTTPException(status_code=404, detail="Notification not found")
            
        return {"message": "Notification deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete notification")
