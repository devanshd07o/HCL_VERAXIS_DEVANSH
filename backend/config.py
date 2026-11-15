"""
MULTIINTEL AI — Global Configuration & Dynamic Key Pool Manager
Manages round-robin rotation across active Groq API keys with seamless failover and Gemini fallback.
"""

import os
import json
import time
import threading
from typing import List, Optional, Tuple, Dict, Any
from dotenv import load_dotenv
from crewai import LLM

# Load environment
load_dotenv()

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS_JSON_FILE = os.path.join(PROJECT_ROOT, "assets", "groq_keys.json")
SERVICE_KEYS_FILE = os.path.join(PROJECT_ROOT, "assets", "service_keys.json")

DEFAULT_5_KEYS = []


class KeyManager:
    """
    Thread-safe Key Manager for round-robin rotation, dynamic addition/removal,
    and cooldown tracking across the managed 5-key Groq pool with Gemini fallback.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self.groq_keys: List[str] = []
        self.gemini_key: str = os.getenv("GEMINI_API_KEY", "")
        self.primary_model: str = os.getenv("GROQ_PRIMARY_MODEL", "openai/gpt-oss-120b")
        self.fast_model: str = os.getenv("GROQ_FAST_MODEL", "qwen/qwen3.8-27b")
        self.gemini_model: str = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash")
        
        self.current_index = 0
        self.cooldowns: Dict[str, float] = {}  # key -> cooldown_until_timestamp
        self.cooldown_duration = 60.0  # 60s cooldown for rate limited keys
        
        self._load_keys()

    def _load_keys(self) -> None:
        """Load keys from environment variables (.env), persistent JSON file, or defaults."""
        loaded = []

        # 1. First check server environment variables (.env) - Owner's private server keys
        env_keys = os.getenv("GROQ_API_KEYS") or os.getenv("GROQ_API_KEY") or os.getenv("ZERNEXA_GROQ_KEYS")
        if env_keys:
            for k in env_keys.split(","):
                k_clean = k.strip()
                if k_clean and k_clean.startswith("gsk_") and k_clean not in loaded:
                    loaded.append(k_clean)

        # 2. From persistent JSON file
        if os.path.exists(KEYS_JSON_FILE):
            try:
                with open(KEYS_JSON_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for k in data:
                            k_clean = str(k).strip()
                            if k_clean and k_clean.startswith("gsk_") and k_clean not in loaded:
                                loaded.append(k_clean)
            except Exception as e:
                print(f"[KeyManager] Error reading {KEYS_JSON_FILE}: {e}")

        # 3. Fallback to default 5 keys if empty
        if not loaded:
            loaded = list(DEFAULT_5_KEYS)
            self._save_keys_to_file(loaded)

        # Enforce maximum 5 active keys
        self.groq_keys = loaded[:5]
        print(f"[KeyManager] Initialized active pool with {len(self.groq_keys)} managed Groq API keys.")

    def _save_keys_to_file(self, keys: List[str]) -> None:
        """Persist key list to assets/groq_keys.json."""
        try:
            os.makedirs(os.path.dirname(KEYS_JSON_FILE), exist_ok=True)
            with open(KEYS_JSON_FILE, "w", encoding="utf-8") as f:
                json.dump(keys, f, indent=2)
        except Exception as e:
            print(f"[KeyManager] Error saving keys file: {e}")

    def add_key(self, raw_key: str) -> Tuple[bool, str]:
        """Add a new Groq key to the pool (up to 5 keys max)."""
        clean_key = raw_key.strip()
        if not clean_key or not clean_key.startswith("gsk_"):
            return False, "Invalid Groq API key format (must start with 'gsk_')."

        with self._lock:
            if clean_key in self.groq_keys:
                return False, "Key already exists in active pool."
            if len(self.groq_keys) >= 5:
                return False, "Maximum 5 keys allowed. Remove an existing key first."

            self.groq_keys.append(clean_key)
            self._save_keys_to_file(self.groq_keys)
            return True, "Key added successfully."

    def remove_key(self, target: str) -> Tuple[bool, str]:
        """Remove a key by exact match or masked match from active pool."""
        with self._lock:
            if len(self.groq_keys) <= 1:
                return False, "At least one active API key must remain in the pool."

            removed = False
            # Check exact match
            if target in self.groq_keys:
                self.groq_keys.remove(target)
                removed = True
            else:
                # Check masked match (e.g. gsk_m6Pu...5fi)
                for k in list(self.groq_keys):
                    masked = f"{k[:8]}••••{k[-4:]}"
                    if target in (k, masked) or k.endswith(target[-4:]):
                        self.groq_keys.remove(k)
                        removed = True
                        break

            if removed:
                self._save_keys_to_file(self.groq_keys)
                return True, "Key removed from pool."
            return False, "Key not found in pool."

    def get_keys_info(self) -> List[Dict[str, Any]]:
        """Return list of keys with masked representation and live status."""
        now = time.time()
        results = []
        with self._lock:
            for idx, k in enumerate(self.groq_keys):
                cd = self.cooldowns.get(k, 0.0)
                is_cooling = now < cd
                masked = f"{k[:8]}••••••••{k[-4:]}" if len(k) >= 12 else k
                results.append({
                    "id": idx,
                    "masked": masked,
                    "key_prefix": k[:8],
                    "status": "cooldown" if is_cooling else "active",
                    "cooldown_remaining": max(0, int(cd - now)) if is_cooling else 0
                })
        return results

    def get_active_groq_key(self) -> str:
        """Return the next available key not under cooldown."""
        with self._lock:
            if not self.groq_keys:
                raise RuntimeError("No Groq API keys found in pool.")
            
            now = time.time()
            total = len(self.groq_keys)
            
            # Search for a key whose cooldown expired
            for _ in range(total):
                candidate = self.groq_keys[self.current_index % total]
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
            "fast_model": self.fast_model,
            "gemini_available": bool(self.gemini_key),
            "fallback_model": self.gemini_model
        }


# Global Key Manager instance
key_manager = KeyManager()


def get_service_keys(service_name: str, env_var_name: str = "") -> List[str]:
    """
    Retrieves configured keys for an auxiliary research service
    (tavily, semantic_scholar, serper, exa, youcom, etc.).
    First checks process environment variables.
    Then checks assets/service_keys.json.
    """
    # 1. Environment variables
    env_name = env_var_name or f"{service_name.upper()}_API_KEY"
    env_val = os.environ.get(env_name) or os.environ.get(f"{service_name.upper()}_KEYS") or os.environ.get(f"ZERNEXA_{service_name.upper()}_KEYS")
    if env_val:
        return [k.strip() for k in env_val.split(",") if k.strip()]

    # 2. assets/service_keys.json
    try:
        if os.path.exists(SERVICE_KEYS_FILE):
            with open(SERVICE_KEYS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict) and service_name in data:
                    val = data[service_name]
                    if isinstance(val, list):
                        return [str(k).strip() for k in val if str(k).strip()]
                    elif isinstance(val, str) and val.strip():
                        return [val.strip()]
    except Exception as e:
        print(f"[KeyManager] Error loading service keys for {service_name}: {e}")

    return []


def set_service_key(service_name: str, key_val: str) -> bool:
    """Save or update service key in assets/service_keys.json and os.environ."""
    clean_key = key_val.strip()
    try:
        data = {}
        if os.path.exists(SERVICE_KEYS_FILE):
            with open(SERVICE_KEYS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        if clean_key:
            data[service_name] = [clean_key]
            os.environ[f"{service_name.upper()}_API_KEY"] = clean_key
        else:
            data.pop(service_name, None)
            os.environ.pop(f"{service_name.upper()}_API_KEY", None)
        with open(SERVICE_KEYS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"[KeyManager] Error saving service key for {service_name}: {e}")
        return False


def get_llm(model_tier: str = "primary", temperature: float = 0.2) -> LLM:
    """
    Factory function to produce a CrewAI LLM configured for Groq ultra-fast LPU
    or automatic Gemini fallback.
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
