from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


# ── Notes ─────────────────────────────────────────────────────────────────────

class NoteResponse(BaseModel):
    id:         str
    body:       str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NoteCreate(BaseModel):
    body: str


# ── Incidents ─────────────────────────────────────────────────────────────────

class IncidentIngest(BaseModel):
    workspace_id: str
    service_name: str
    raw_log:      str


class IncidentResponse(BaseModel):
    id:                  str
    sqs_message_id:      Optional[str]          = None
    workspace_id:        str
    service_name:        str
    raw_log:             str
    status:              str
    root_cause_analysis: Optional[str]          = None
    actionable_fix:      Optional[str]          = None
    created_at:          datetime
    notes:               list[NoteResponse]     = []

    model_config = ConfigDict(from_attributes=True)


class IncidentListResponse(BaseModel):
    items:     list[IncidentResponse]
    total:     int
    page:      int
    page_size: int


class DashboardStatsResponse(BaseModel):
    total_incidents: int
    analyzed:        int
    failed:          int
    pending:         int
    success_rate:    float