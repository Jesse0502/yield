"""
Database client module for Supabase integration.
"""

from supabase import create_client, Client
from src.core.config import settings


def get_supabase_client() -> Client:
    """
    Initialize and return Supabase client.
    
    Returns:
        Client: Authenticated Supabase client instance
    """
    return create_client(settings.supabase_url, settings.supabase_key)


# Global Supabase client instance
supabase = get_supabase_client()
