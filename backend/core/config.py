from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Allow extra fields without failing
    )

    PROJECT_NAME: str = "Clueless AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v
    
    # AI Services
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_API_KEY_ALT: Optional[str] = None
    CHATBOT_GEMINI_API_KEY: Optional[str] = None
    SERPAPI_KEY: Optional[str] = None
    FAL_KEY: Optional[str] = None
    REMOVE_BG_API_KEY: Optional[str] = None
    HF_TOKEN: Optional[str] = None
    HF_TOKEN_ALT: Optional[str] = None
    
    # High-Fidelity Try-On Worker (Google Colab / Dedicated GPU)
    COLAB_WORKER_URL: Optional[str] = None

settings = Settings()
