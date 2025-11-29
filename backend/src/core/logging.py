"""
Centralized logging configuration for the backend.
"""

import logging
import logging.config
from typing import Any, Dict

from src.core.config import settings


def _build_logging_config() -> Dict[str, Any]:
    level = settings.log_level.upper()
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                "datefmt": "%Y-%m-%dT%H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": level,
                "formatter": "default",
            },
        },
        "loggers": {
            "uvicorn": {"level": level, "handlers": ["console"], "propagate": False},
            "uvicorn.error": {"level": level, "handlers": ["console"], "propagate": False},
            "uvicorn.access": {"level": level, "handlers": ["console"], "propagate": False},
            "yield": {"level": level, "handlers": ["console"], "propagate": False},
        },
        "root": {"level": level, "handlers": ["console"]},
    }


def setup_logging() -> None:
    """Apply the logging configuration."""
    logging.config.dictConfig(_build_logging_config())


def get_logger(name: str) -> logging.Logger:
    """Helper to get a namespaced logger."""
    return logging.getLogger(name)


