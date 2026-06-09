from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.models.incident import ErrorLog
from app.models.user import User
from app.core.deps import get_current_user
from app.schemas.incident import IncidentResponse, IncidentListResponse
from beanie import PydanticObjectId

router = APIRouter(prefix="/incidents", tags=["Incidents"])

def _to_response(log: ErrorLog) -> IncidentResponse:
    return IncidentResponse(
        id=str(log.id),
        sqs_message_id=log.sqs_message_id,
        workspace_id=log.workspace_id,
        service_name=log.service_name,
        raw_log=log.raw_log,
        status=log.status,
        root_cause_analysis=log.root_cause_analysis,
        actionable_fix=log.actionable_fix,
        created_at=log.timestamp
    )

@router.get("/", response_model=IncidentListResponse)
async def list_incidents(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    status: str = Query(default=None),
    current_user: User = Depends(get_current_user)
):
    """Returns paginated incidents for the authenticated user's workspace."""
    workspace_id = f"workspace-{str(current_user.id)[:8]}"

    query = ErrorLog.find(ErrorLog.workspace_id == workspace_id)

    if status:
        query = ErrorLog.find(
            ErrorLog.workspace_id == workspace_id,
            ErrorLog.status == status
        )

    total = await query.count()
    skip = (page - 1) * page_size
    logs = await query.sort(-ErrorLog.timestamp).skip(skip).limit(page_size).to_list()

    return IncidentListResponse(
        items=[_to_response(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user)
):
    """Returns a single incident by ID."""
    try:
        obj_id = PydanticObjectId(incident_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid incident ID format")

    log = await ErrorLog.get(obj_id)

    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    workspace_id = f"workspace-{str(current_user.id)[:8]}"
    if log.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return _to_response(log)

@router.delete("/{incident_id}", status_code=status.HTTP_200_OK)
async def delete_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user)
):
    """Deletes an incident by ID."""

    try:
        obj_id = PydanticObjectId(incident_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid incident ID format")

    log = await ErrorLog.get(obj_id)

    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    
    workspace_id = f"workspace-{str(current_user.id)[:8]}"
    if log.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    await log.delete()
    return {"detail": "Incident deleted successfully"}