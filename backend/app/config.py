from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"

    JWT_SECRET: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    FRONTEND_ORIGIN: str = "http://localhost:3000"
    COOKIE_SECURE: bool = False  # True in production (https)

    class Config:
        env_file = ".env"


settings = Settings()
