from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field

class User(Document):
    email: Indexed(str, unique=True)
    password_hash: str
    name: str
    role: str
    goal: str
    company: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        populate_by_name = True