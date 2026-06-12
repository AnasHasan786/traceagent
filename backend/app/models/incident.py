from datetime import datetime
from typing import Optional, Any
from beanie import Document
from pydantic import BaseModel, Field
import uuid


class IncidentNote(BaseModel):
    """Embedded subdocument — stored inside ErrorLog.notes array in MongoDB."""
    id:         str      = Field(default_factory=lambda: str(uuid.uuid4())[:16])
    body:       str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Workspace(Document):
    workspace_id: str      = Field(unique=True)
    created_at:   datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "workspaces"


class ErrorLog(Document):
    sqs_message_id:      Optional[str]           = None
    workspace_id:        str
    service_name:        str
    raw_log:             str
    status:              str                      = Field(default="pending")
    root_cause_analysis: Optional[Any]            = None
    actionable_fix:      Optional[Any]            = None
    timestamp:           datetime                 = Field(default_factory=datetime.utcnow)
    notes:               list[IncidentNote]       = Field(default_factory=list)

    class Settings:
        name = "error_logs"