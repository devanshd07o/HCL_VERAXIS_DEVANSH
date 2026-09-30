"""
VERAXIS AI — Root Config Proxy
Re-exports configuration and KeyManager from backend.config
"""

from backend.config import (
    KeyManager,
    key_manager,
    get_llm
)

__all__ = ["KeyManager", "key_manager", "get_llm"]
