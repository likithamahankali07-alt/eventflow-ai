import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://placeholder-supabase.supabase.co")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "placeholder-key")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    PORT: int = int(os.getenv("PORT", "8000"))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
