from sqlmodel import SQLModel, Field
from datetime import datetime


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str

    is_verified: bool = Field(default=False)
    verification_code: str | None = Field(default=None, index=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
