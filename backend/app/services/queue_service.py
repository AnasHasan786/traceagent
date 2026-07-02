import json
import os
import boto3
from dotenv import load_dotenv
from app.schemas.incident import IncidentIngest

load_dotenv()

# Initialize the programmatic SQS client wrapper
sqs_client = boto3.client(
    "sqs",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

QUEUE_URL = os.getenv("SQS_QUEUE_URL")

def send_to_ingest_queue(incident: IncidentIngest) -> str:
    """
    Serializes the validated payload and dispatches it out into the 
    Amazon SQS distributed buffer cluster asynchronously.
    """
    try:
        # Transform the Pydantic data contract into a stringified JSON payload
        message_body = json.dumps(incident.dict())
        
        response = sqs_client.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=message_body
        )
        # Return the unique message identifier assigned by AWS
        return response.get("MessageId")
        
    except Exception as e:
        print(f"[QUEUE CRITICAL FAILURE] Failed to push to SQS: {str(e)}")
        raise e