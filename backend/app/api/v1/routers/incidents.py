from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional
import json as _json
from app.models.incident import ErrorLog
from app.models.user import User
from app.core.deps import get_current_user
from app.schemas.incident import IncidentIngest, IncidentResponse, IncidentListResponse, NoteResponse
from app.services.queue_service import send_to_ingest_queue
from beanie import PydanticObjectId

router = APIRouter(prefix="/incidents", tags=["Incidents"])


def _to_response(log: ErrorLog) -> IncidentResponse:
    def _to_str(val) -> Optional[str]:
        if val is None:
            return None
        if isinstance(val, str):
            return val
        return _json.dumps(val, indent=2)

    return IncidentResponse(
        id=str(log.id),
        sqs_message_id=log.sqs_message_id,
        workspace_id=log.workspace_id,
        service_name=log.service_name,
        raw_log=log.raw_log,
        status=log.status,
        root_cause_analysis=_to_str(log.root_cause_analysis),
        actionable_fix=_to_str(log.actionable_fix),
        failure_reason=log.failure_reason,
        created_at=log.timestamp,
        notes=[
            NoteResponse(id=n.id, body=n.body, created_at=n.created_at)
            for n in (log.notes or [])
        ],
    )


# ── POST /incidents — submit stack trace ──────────────────────────────────────

@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def submit_incident(
    incident:     IncidentIngest,
    current_user: User = Depends(get_current_user),
):
    try:
        msg_id = send_to_ingest_queue(incident)
        return {
            "status":         "queued",
            "message":        "Incident safely parked in the ingestion queue buffer.",
            "sqs_message_id": msg_id,
            "log_id":         None,
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Telemetry ingestion broker failed to write buffer state.",
        )


# ── GET /incidents — list incidents ──────────────────────────────────────────

@router.get("", response_model=IncidentListResponse)
async def list_incidents(
    page:         int  = Query(default=1, ge=1),
    page_size:    int  = Query(default=10, ge=1, le=100),
    status:       str  = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    workspace_id = f"workspace-{str(current_user.id)[:8]}"
    query = ErrorLog.find(ErrorLog.workspace_id == workspace_id)
    if status:
        query = ErrorLog.find(
            ErrorLog.workspace_id == workspace_id,
            ErrorLog.status == status,
        )
    total = await query.count()
    skip  = (page - 1) * page_size
    logs  = await query.sort(-ErrorLog.timestamp).skip(skip).limit(page_size).to_list()
    return IncidentListResponse(
        items=[_to_response(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
    )


# ── GET /incidents/{id} ───────────────────────────────────────────────────────

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id:  str,
    current_user: User = Depends(get_current_user),
):
    try:
        obj_id = PydanticObjectId(incident_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid incident ID format.")

    log = await ErrorLog.get(obj_id)
    if not log:
        raise HTTPException(status_code=404, detail="Incident not found.")

    workspace_id = f"workspace-{str(current_user.id)[:8]}"
    if log.workspace_id != workspace_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return _to_response(log)


# ── DELETE /incidents/{id} ────────────────────────────────────────────────────

@router.delete("/{incident_id}")
async def delete_incident(
    incident_id:  str,
    current_user: User = Depends(get_current_user),
):
    try:
        obj_id = PydanticObjectId(incident_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid incident ID format.")

    log = await ErrorLog.get(obj_id)
    if not log:
        raise HTTPException(status_code=404, detail="Incident not found.")

    workspace_id = f"workspace-{str(current_user.id)[:8]}"
    if log.workspace_id != workspace_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    await log.delete()
    return {"message": "Incident deleted successfully."}