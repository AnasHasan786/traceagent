import json
import os
import time
from pathlib import Path
import boto3
from dotenv import load_dotenv

load_dotenv()

# Initialize programmatic SQS Client
sqs_client = boto3.client(
    "sqs",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

QUEUE_URL = os.getenv("SQS_QUEUE_URL")


def process_message(message_body: dict):
    """
    This is the staging area where our Multi-Agent AI Framework will live.
    For this step, we parse and verify the incoming data contract.
    """
    print("\n" + "=" * 50)
    print("🔥 [WORKER] TRIGGERED - RETRIEVED INCIDENT FROM QUEUE")
    print(f"📦 Workspace ID: {message_body.get('workspace_id')}")
    print(f"⚙️  Crashing Service: {message_body.get('service_name')}")
    print(f"📝 Raw Stack Trace Captured:\n{message_body.get('raw_log')}")
    print("=" * 50 + "\n")

    time.sleep(2)


def start_worker():
    """
    Infinite worker daemon loop that polls SQS for incoming telemetry data.
    """
    print(f"🚀 Incident Analysis Background Worker started. Polling: {QUEUE_URL}...")

    while True:
        try:
            # Long-poll SQS for messages
            response = sqs_client.receive_message(
                QueueUrl=QUEUE_URL,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,
                VisibilityTimeout=30,
            )

            messages = response.get("Messages", [])

            if not messages:
                print("[Worker] Queue empty. Listening for new stack traces...")
                continue

            for msg in messages:
                receipt_handle = msg.get("ReceiptHandle")
                body = json.loads(msg.get("Body"))

                # Hand over to our processing pipeline
                process_message(body)

                # Delete the message from SQS so it isn't re-processed
                sqs_client.delete_message(
                    QueueUrl=QUEUE_URL, ReceiptHandle=receipt_handle
                )
                print(
                    "✅ [Worker] Message processed successfully and cleared from queue."
                )

        except Exception as e:
            print(f"🚨 [Worker Error] Connection or processing failure: {str(e)}")
            time.sleep(5)


if __name__ == "__main__":
    start_worker()
