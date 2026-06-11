from datetime import datetime
from typing import Optional, Any
from beanie import Document
from pydantic import Field

class Workspace(Document):
    workspace_id: str = Field(unique=True)
    created_at:   datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "workspaces"

class ErrorLog(Document):
    sqs_message_id:      Optional[str] = None
    workspace_id:        str
    service_name:        str
    raw_log:             str
    status:              str = Field(default="pending")
    root_cause_analysis: Optional[Any] = None  # Any — tolerates old nested objects
    actionable_fix:      Optional[Any] = None  # Any — tolerates old nested objects
    timestamp:           datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "error_logs"