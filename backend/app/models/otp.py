from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field

class OTPRecord(Document):
    email: str
    otp: str
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "otp_records"
        