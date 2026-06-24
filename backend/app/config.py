import ssl
from typing import Any
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://rag:ragpassword@localhost:5432/ragdb"
    database_connect_args: dict[str, Any] = Field(default_factory=dict)

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            v = "postgresql+asyncpg://" + v[len("postgres://") :]
        elif v.startswith("postgresql://") and "+asyncpg" not in v:
            v = "postgresql+asyncpg://" + v[len("postgresql://") :]
        return v

    @model_validator(mode="after")
    def extract_asyncpg_connect_args(self) -> "Settings":
        parsed = urlparse(self.database_url)
        query = parse_qs(parsed.query)
        sslmode = query.pop("sslmode", [None])[0]
        if sslmode in ("require", "prefer"):
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            self.database_connect_args = {"ssl": ctx}
        elif sslmode in ("verify-ca", "verify-full"):
            self.database_connect_args = {"ssl": ssl.create_default_context()}
        if query:
            self.database_url = urlunparse(
                parsed._replace(query=urlencode({k: v[0] for k, v in query.items()}))
            )
        elif sslmode:
            self.database_url = urlunparse(parsed._replace(query=""))
        return self

    jwt_secret: str = "super-secret-jwt-key-change-in-production-32chars"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
    cors_origins: str = "http://localhost:3000"
    upload_dir: str = "./uploads"
    max_upload_size: int = 10 * 1024 * 1024
    openai_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
