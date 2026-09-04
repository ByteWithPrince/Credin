import os
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-2.5-flash")
    LLM_BASE_URL: Optional[str] = os.getenv("LLM_BASE_URL")
    ENV: str = os.getenv("ENV", "dev")
    _cors_origins_raw: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self._cors_origins_raw.split(",") if origin.strip()]

settings = Settings()
