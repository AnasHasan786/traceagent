from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId

from app.models.incident import ErrorLog, IncidentNote
from app.models.user import User
from app.core.deps import get_current_user
from app.schemas.incident import NoteCreate, NoteResponse

router = APIRouter(prefix="/incidents", tags=["Notes"])


def _auth_log(log: ErrorLog | None, current_user: User) -> ErrorLog:
    """Raises 404/403 if log is missing or belongs to a different workspace."""
    if not log:
        raise HTTPException(status_code=404, detail="Incident not found.")
    workspace_id = f"workspace-{str(current_user.id)[:8]}"
    if log.workspace_id != workspace_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return log


# ── POST /incidents/{id}/notes ────────────────────────────────────────────────

@router.post(
    "/{incident_id}/notes",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_note(
    incident_id:  str,
    payload:      NoteCreate,
    current_user: User = Depends(get_current_user),
):
    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Note body cannot be empty.")
    if len(body) > 2000:
        raise HTTPException(status_code=422, detail="Note exceeds 2000 character limit.")

    try:
        obj_id = PydanticObjectId(incident_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid incident ID format.")

    log = await ErrorLog.get(obj_id)
    _auth_log(log, current_user)

    note = IncidentNote(body=body)
    log.notes.append(note)
    await log.save()

    return NoteResponse(
        id=note.id,
        body=note.body,
        created_at=note.created_at,
    )


# ── DELETE /incidents/{id}/notes/{note_id} ────────────────────────────────────

@router.delete(
    "/{incident_id}/notes/{note_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_note(
    incident_id:  str,
    note_id:      str,
    current_user: User = Depends(get_current_user),
):
    try:
        obj_id = PydanticObjectId(incident_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid incident ID format.")

    log = await ErrorLog.get(obj_id)
    _auth_log(log, current_user)

    original_len = len(log.notes)
    log.notes    = [n for n in log.notes if n.id != note_id]

    if len(log.notes) == original_len:
        raise HTTPException(status_code=404, detail="Note not found.")

    await log.save()
    return {"message": "Note deleted."}