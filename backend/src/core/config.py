"""
Configuration module for the application.
Uses Pydantic Settings to load environment variables.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # xAI Configuration
    xai_api_key: str = Field(..., validation_alias="XAI_API_KEY")
    
    # Google AI Configuration
    google_api_key: str = Field(..., validation_alias="GOOGLE_API_KEY")
    
    # Supabase Configuration
    supabase_url: str = Field(..., validation_alias="SUPABASE_URL")
    supabase_key: str = Field(..., validation_alias="SUPABASE_KEY")
    supabase_jwt_secret: str = Field(..., validation_alias="SUPABASE_JWT_SECRET")
    
    
    # Server Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Frontend Configuration
    frontend_url: str = "http://localhost:3000"
    
    # Logging
    log_level: str = Field("INFO", validation_alias="LOG_LEVEL")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Global settings instance
settings = Settings()

