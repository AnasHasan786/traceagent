from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field

class Workspace(Document):
    """
    Groups error logs by architectural project domain.
    """
    workspace_id: str = Field(unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ErrorLog(Document):
    """
    Stores the incoming raw system state along with the single-pass analytical response compiled by Amazon Bedrock.
    """
    workspace_id: str
    service_name: str
    raw_log: str
    status: str = Field(default="pending")
    root_cause_analysis: Optional[str] = None
    actionable_fix: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
