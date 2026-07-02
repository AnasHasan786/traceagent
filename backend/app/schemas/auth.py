from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime

UserRole = Literal["individual", "team_lead", "sre", "student"]
UserGoal = Literal["debug_faster", "learn_errors", "monitor_team", "thesis_demo"]

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    goal: UserGoal
    company: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    goal: UserGoal
    company: Optional[str] = None
    created_at: datetime = Field(..., serialization_alias="createdAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

class UpdateProfileRequest(BaseModel):
    name:    Optional[str] = None
    company: Optional[str] = None