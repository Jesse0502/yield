"""
Main entry point for the yield AI Memory Assistant backend.
Initializes FastAPI app with CORS middleware and API routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.api.routes import chat, notifications, memories, files, search
from src.core.config import settings
from src.core.logging import setup_logging, get_logger
from src.services.scheduler_service import start_scheduler

setup_logging()
logger = get_logger("yield.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting yield AI Memory Assistant")
    start_scheduler()
    try:
        yield
    finally:
        logger.info("Shutting down yield AI Memory Assistant")

# Initialize FastAPI application
app = FastAPI(
    title="yield AI Memory Assistant",
    description="Backend API for yield - An intelligent digital memory assistant",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,      # Frontend URL from .env
        "http://localhost:3000",    # Frontend development server
        "http://127.0.0.1:3000",    # Alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Include API routers
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(notifications.router, prefix="/api", tags=["notifications"])
app.include_router(memories.router, prefix="/api", tags=["memories"])
app.include_router(files.router, prefix="/api", tags=["files"])
app.include_router(search.router, prefix="/api", tags=["search"])

 
@app.get("/")
def root():
    """Root endpoint returning API status."""
    return {
        "message": "Welcome to yield AI Memory Assistant", 
        "status": "online",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "yield-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
        log_level="info"
    )
