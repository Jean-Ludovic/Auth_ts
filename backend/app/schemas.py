from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
class RegisterIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class VerifyCodeIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=4)


class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    is_verified: bool

    class Config:
        from_attributes = True 
        
class UserMeOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    emailVerified: bool
    createdAt: datetime

class ForgotPasswordIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr

class ResetPasswordIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    token: str = Field(min_length=10)
    new_password: str = Field(min_length=8, max_length=72)