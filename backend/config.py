"""
MULTIINTEL AI — Global Configuration & Multi-Key Failover Engine
Manages round-robin rotation across 41 Groq API keys with seamless Gemini fallback.
"""

import os
import time
import threading
from typing import List, Optional, Tuple
from dotenv import load_dotenv
from crewai import LLM

# Load environment
load_dotenv()

class KeyManager:
    """
    Thread-safe Key Manager for round-robin rotation and cooldown tracking
    across the pool of 41 free-tier Groq API keys with Gemini fallback.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self.groq_keys: List[str] = []
        self.gemini_key: str = os.getenv("GEMINI_API_KEY", "")
        self.primary_model: str = os.getenv("GROQ_PRIMARY_MODEL", "openai/gpt-oss-120b")
        self.fast_model: str = os.getenv("GROQ_FAST_MODEL", "openai/gpt-oss-20b")
        self.gemini_model: str = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash")
        
        self.current_index = 0
        self.cooldowns: dict[str, float] = {}  # key -> cooldown_until_timestamp
        self.cooldown_duration = 60.0  # 60s cooldown for rate limited keys
        
        self._load_keys()

    def _load_keys(self) -> None:
        """Load keys from environment variables, comma-separated GROQ_API_KEYS, or optional keys file."""
        loaded = []
        
        # 1. Comma-separated keys in GROQ_API_KEYS
        env_keys = os.getenv("GROQ_API_KEYS", "")
        if env_keys:
            for k in env_keys.split(","):
                k_clean = k.strip()
                if k_clean and k_clean.startswith("gsk_") and k_clean not in loaded:
                    loaded.append(k_clean)

        # 2. Single GROQ_API_KEY
        env_key = os.getenv("GROQ_API_KEY", "").strip()
        if env_key and env_key.startswith("gsk_") and env_key not in loaded:
            loaded.append(env_key)

        # 3. Optional keys file specified via GROQ_KEYS_FILE
        keys_file = os.getenv("GROQ_KEYS_FILE", "")
        if keys_file and os.path.exists(keys_file):
            try:
                with open(keys_file, "r", encoding="utf-8") as f:
                    for line in f:
                        k = line.strip()
                        if k and k.startswith("gsk_") and k not in loaded:
                            loaded.append(k)
            except Exception as e:
                print(f"[KeyManager] Warning reading keys file: {e}")

        self.groq_keys = loaded
        print(f"[KeyManager] Initialized pool with {len(self.groq_keys)} verified Groq API keys.")

    def get_active_groq_key(self) -> str:
        """Return the next available key not under cooldown."""
        with self._lock:
            if not self.groq_keys:
                raise RuntimeError("No Groq API keys found in pool or environment.")
            
            now = time.time()
            total = len(self.groq_keys)
            
            # Search for a key whose cooldown expired
            for _ in range(total):
                candidate = self.groq_keys[self.current_index]
                self.current_index = (self.current_index + 1) % total
                
                cd = self.cooldowns.get(candidate, 0.0)
                if now >= cd:
                    return candidate
            
            # If all are cooling down, return key with lowest cooldown remaining
            best_key = min(self.groq_keys, key=lambda k: self.cooldowns.get(k, 0.0))
            return best_key

    def mark_rate_limited(self, key: str) -> None:
        """Place key in temporary cooldown on HTTP 429 / RateLimit."""
        with self._lock:
            self.cooldowns[key] = time.time() + self.cooldown_duration
            print(f"[KeyManager] Key {key[:8]}... put on {self.cooldown_duration}s cooldown.")

    def get_status_telemetry(self) -> dict:
        """Return operational health status for frontend dashboard."""
        now = time.time()
        active = sum(1 for k in self.groq_keys if now >= self.cooldowns.get(k, 0.0))
        return {
            "total_keys": len(self.groq_keys),
            "active_keys": active,
            "cooling_down": len(self.groq_keys) - active,
            "primary_model": self.primary_model,
            "gemini_available": bool(self.gemini_key),
            "fallback_model": self.gemini_model
        }


# Global Key Manager instance
key_manager = KeyManager()


def get_llm(model_tier: str = "primary", temperature: float = 0.2) -> LLM:
    """
    Factory function to produce a CrewAI LLM configured for Groq ultra-fast LPU
    or automatic Gemini fallback.
    
    Args:
        model_tier: 'primary' (gpt-oss-120b), 'fast' (gpt-oss-20b), or 'gemini'
        temperature: sampling temperature
    """
    if model_tier == "gemini":
        gemini_key = key_manager.gemini_key
        if not gemini_key:
            raise ValueError("GEMINI_API_KEY is not configured for fallback.")
        return LLM(
            model=f"gemini/{key_manager.gemini_model}",
            api_key=gemini_key,
            temperature=temperature
        )

    # Groq OpenAI-compatible endpoints
    key = key_manager.get_active_groq_key()
    model_name = key_manager.primary_model if model_tier == "primary" else key_manager.fast_model

    return LLM(
        model=f"openai/{model_name}",
        base_url="https://api.groq.com/openai/v1",
        api_key=key,
        temperature=temperature
    )
