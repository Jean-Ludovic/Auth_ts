from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str

    is_verified: bool = Field(default=False)
    verification_code: str | None = Field(default=None, index=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    # --- Forgot password fields ---
    password_reset_token_hash: Optional[str] = Field(default=None, index=True)
    password_reset_expires_at: Optional[datetime] = Field(default=None, index=True)
