from pydantic import BaseModel
from typing import Optional


class DayCount(BaseModel):
    date:  str
    count: int


class StatusCount(BaseModel):
    status: str
    label:  str
    count:  int
    color:  str


class ServiceCount(BaseModel):
    service:  str
    total:    int
    failures: int


class AnalyticsResponse(BaseModel):
    incidents_over_time:  list[DayCount]
    status_breakdown:     list[StatusCount]
    top_services:         list[ServiceCount]
    total:                int
    analyzed:             int
    failed:               int
    pending:              int
    busiest_day:          Optional[str]
    most_failing_service: Optional[str]