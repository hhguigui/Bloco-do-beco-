from typing import Optional

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=200)


class SessionRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=500)


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str = ""
    role: str = "customer"  # "customer" or "talent"
    phones: list[str] = Field(default_factory=list)  # Multiple contact phones


class Me(BaseModel):
    user: Optional[User] = None
    is_admin: bool = False
