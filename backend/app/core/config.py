import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

# Search potential .env paths
possible_env_paths = [
    Path(__file__).resolve().parent.parent.parent / ".env",          # backend/.env
    Path(__file__).resolve().parent.parent.parent.parent / "backend" / ".env", # backend/.env
    Path.cwd() / ".env",
    Path.cwd() / "backend" / ".env",
]

for env_path in possible_env_paths:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        break


class Settings(BaseSettings):
    model_config = ConfigDict(extra="ignore")

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Models
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "gemini-embedding-2")
    GENERATION_MODEL: str = os.getenv("GENERATION_MODEL", "gemini-3.5-flash-lite")
    
    # Limits & Thresholds
    SEMANTIC_CACHE_THRESHOLD: float = float(os.getenv("SEMANTIC_CACHE_THRESHOLD", "0.92"))
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.35"))
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
    MAX_PAGES: int = int(os.getenv("MAX_PAGES", "3000"))
    
    # RAG params
    DEFAULT_CHUNK_SIZE: int = int(os.getenv("DEFAULT_CHUNK_SIZE", "600"))
    DEFAULT_CHUNK_OVERLAP: int = int(os.getenv("DEFAULT_CHUNK_OVERLAP", "100"))
    TOP_K_RETRIEVAL: int = int(os.getenv("TOP_K_RETRIEVAL", "20"))
    TOP_K_RERANK: int = int(os.getenv("TOP_K_RERANK", "5"))
    RRF_K: int = int(os.getenv("RRF_K", "60"))


settings = Settings()
