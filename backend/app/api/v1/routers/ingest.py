from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.incident import IncidentIngest
from app.services.queue_service import send_to_ingest_queue
from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter(prefix="/ingest", tags=["Ingestion Pipeline"])

@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def ingest_incident(
    incident: IncidentIngest,
    current_user: User = Depends(get_current_user)
):
    """Validates payload and pushes stack trace to SQS ingestion queue."""
    try:
        msg_id = send_to_ingest_queue(incident)
        return {
            "status": "queued",
            "message": "Incident safely parked in the ingestion queue buffer.",
            "sqs_message_id": msg_id,
            "log_id": None
        }

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Telemetry ingestion broker failed to write buffer state."
        )
