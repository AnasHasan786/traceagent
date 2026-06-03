import json
import os
import time
import asyncio
import boto3
from dotenv import load_dotenv
from app.core.db import init_db
from app.models.incident import Workspace, ErrorLog

load_dotenv()

# Initialize programmatic SQS Client
sqs_client = boto3.client(
    "sqs",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

QUEUE_URL = os.getenv("SQS_QUEUE_URL")


async def process_message(message_body: dict):
    """
    Processes the raw trace log and saves its state into MongoDB Atlas.
    """

    workspace_id = message_body.get("workspace_id")
    service_name = message_body.get("service_name")
    raw_log = message_body.get("raw_log")

    print(f"\n📥 [Worker] Processing trace from service: {service_name}")

    workspace = await Workspace.find_one(Workspace.workspace_id == workspace_id)
    if not workspace:
        workspace = Workspace(workspace_id=workspace_id)
        await workspace.insert()
        print(f"✨ Created new cloud workspace reference: {workspace_id}")

    error_entry = ErrorLog(
        workspace_id=workspace_id,
        service_name=service_name,
        raw_log=raw_log,
        status="pending"
    )
    await error_entry.insert()
    print(f"💾 Log saved to MongoDB Atlas with ID: {error_entry.id}")
    

async def start_worker():
    """
    Infinite worker daemon loop that polls SQS for incoming telemetry data.
    """
    await init_db()
    print(f"🚀 Incident Background Consumer live. Polling: {QUEUE_URL}...")

    while True:
        try:
            # Long-poll SQS for messages
            response = await asyncio.to_thread(
                sqs_client.receive_message,
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
                await process_message(body)

                # Clear from queue state
                await asyncio.to_thread(
                    sqs_client.delete_message,
                    QueueUrl=QUEUE_URL,
                    ReceiptHandle=receipt_handle
                )
                print("✅ [Worker] Message processed and cleared from queue safely.")

        except Exception as e:
            print(f"🚨 [Worker Error] Connection or processing failure: {str(e)}")
            await asyncio.sleep(5)  


if __name__ == "__main__":
    asyncio.run(start_worker())
