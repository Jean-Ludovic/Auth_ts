from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"

    JWT_SECRET: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    FRONTEND_ORIGIN: str = "http://localhost:3000"
    COOKIE_SECURE: bool = False

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""

    SMTP_TLS: bool = True   
    SMTP_SSL: bool = False  

    PASSWORD_RESET_EXPIRE_MINUTES: int = 30
    FRONTEND_RESET_PASSWORD_URL: str = "http://localhost:3000/reset-password"
    class Config:
        env_file = ".env"

settings = Settings()
