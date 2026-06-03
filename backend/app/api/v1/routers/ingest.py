from fastapi import APIRouter, HTTPException, status
from app.schemas.incident import IncidentIngest
from app.services.queue_service import send_to_ingest_queue

router = APIRouter(prefix="/ingest", tags=["Ingestion Pipeline"])


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def ingest_incident(incident: IncidentIngest):
    try:
        # Offload the validated model payload directly to our SQS instance
        msg_id = send_to_ingest_queue(incident)

        # This signals that the request is queued and processing asynchronously.
        return {
            "status": "queued",
            "message": "Incident safely parked in the ingestion queue buffer.",
            "sqs_message_id": msg_id,
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Telemetry ingestion broker failed to write buffer state.",
        )
