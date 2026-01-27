from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator, AliasChoices

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",     # ✅ pour lire ton .env
        extra="ignore",
    )

    DATABASE_URL: str = "sqlite:///./app.db"

    JWT_SECRET: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    FRONTEND_ORIGIN: str = "http://localhost:3000"
    COOKIE_SECURE: bool = False

    admin_emails: list[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("ADMIN_EMAILS", "admin_emails"),
    )

    @field_validator("admin_emails", mode="before")
    @classmethod
    def _parse_admin_emails(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [x.strip().lower() for x in v.split(",") if x.strip()]
        if isinstance(v, list):
            return [str(x).strip().lower() for x in v if str(x).strip()]
        return []

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""

    SMTP_TLS: bool = True
    SMTP_SSL: bool = False

    PASSWORD_RESET_EXPIRE_MINUTES: int = 30
    FRONTEND_RESET_PASSWORD_URL: str = "http://localhost:3000/reset-password"

settings = Settings()
