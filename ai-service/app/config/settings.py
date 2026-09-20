from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    CareerPilot AI Service Configuration Settings.
    Reads environment variables from system environment and .env file.
    """
    SERVICE_NAME: str = "careerpilot-ai-service"
    SERVICE_VERSION: str = "1.0.0"
    AI_SERVICE_PORT: int = 8001
    AI_SERVICE_HOST: str = "0.0.0.0"
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
    return Settings()
