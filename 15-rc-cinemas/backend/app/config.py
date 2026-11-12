"""
Application configuration, loaded from environment variables (with sane
local-dev defaults). Copy .env.example to .env and adjust as needed.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./rc_cinemas.db"

    jwt_secret: str = "dev-only-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12  # 12 hours

    cors_origins: str = "http://localhost:5174,http://127.0.0.1:5174"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
