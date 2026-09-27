import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    CareerPilot AI Service Configuration Settings.
    Reads environment variables from system environment and .env file.
    """
    SERVICE_NAME: str = "careerpilot-ai-service"
    SERVICE_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    AI_SERVICE_PORT: int = int(os.environ.get("PORT", os.environ.get("AI_SERVICE_PORT", "8001")))
    AI_SERVICE_HOST: str = os.environ.get("HOST", "0.0.0.0")
    AI_SERVICE_SECRET: str = "placeholder_secret_key_change_in_production"

    # Gemini AI Provider Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_TIMEOUT_MS: int = 10000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    s = Settings()
    if s.ENVIRONMENT.lower() in ["production", "prod"]:
        is_weak_secret = (
            not s.AI_SERVICE_SECRET or
            s.AI_SERVICE_SECRET == "placeholder_secret_key_change_in_production" or
            len(s.AI_SERVICE_SECRET) < 16 or
            "placeholder" in s.AI_SERVICE_SECRET or
            "change_in_production" in s.AI_SERVICE_SECRET
        )
        if is_weak_secret:
            raise ValueError("[FATAL CONFIG ERROR] Insecure or insufficient length AI_SERVICE_SECRET in production (must be >= 16 characters and non-default).")
    return s


