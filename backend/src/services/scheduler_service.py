import logging
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.db.client import supabase

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def check_reminders():
    """
    Periodic task to check for pending reminders and convert them into notifications.
    Runs every 60 seconds.
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Query pending reminders triggered in the past or now
        response = supabase.table("reminders") \
            .select("*") \
            .eq("status", "pending") \
            .lte("trigger_at", now) \
            .execute()
        
        reminders = response.data
        
        if not reminders:
            return

        logger.info(f"Found {len(reminders)} pending reminders to process.")

        for reminder in reminders:
            try:
                # 1. Create Notification
                notif_data = {
                    "user_id": reminder["user_id"],
                    "type": "reminder",
                    "content": reminder["content"],
                    "is_read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Insert notification
                notif_res = supabase.table("notifications").insert(notif_data).execute()
                
                # 2. Update Reminder status
                if notif_res.data:
                    supabase.table("reminders") \
                        .update({"status": "processed"}) \
                        .eq("id", reminder["id"]) \
                        .execute()
                    
                    logger.info(f"Processed reminder {reminder['id']} for user {reminder['user_id']}")
                else:
                    logger.error(f"Failed to create notification for reminder {reminder['id']}")
                    
            except Exception as e:
                logger.error(f"Error processing reminder {reminder['id']}: {str(e)}")
                # Optionally mark as failed or retry count
                supabase.table("reminders") \
                    .update({"status": "failed"}) \
                    .eq("id", reminder["id"]) \
                    .execute()

    except Exception as e:
        logger.error(f"Error in check_reminders task: {str(e)}")

def start_scheduler():
    """Start the background scheduler."""
    if not scheduler.running:
        scheduler.add_job(check_reminders, 'interval', seconds=60)
        scheduler.start()
        logger.info("Scheduler started.")

