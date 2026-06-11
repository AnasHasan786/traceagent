import json
import os
import time
import asyncio
import boto3
import uuid
from dotenv import load_dotenv
from app.core.db import init_db
from app.models.incident import Workspace, ErrorLog
from app.services.analyzer import analyze_stack_trace

load_dotenv()


# ── Config ────────────────────────────────────────────────────────────────────

WORKER_ID = str(uuid.uuid4())[:8]
QUEUE_URL = os.getenv("SQS_QUEUE_URL")
MAX_SQS_DELIVERIES = 3
MAX_RETRIES = 3
VISIBILITY_TIMEOUT = 120

sqs_client = boto3.client(
    "sqs",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _is_fallback_analysis(result: dict | None) -> bool:
    if not result:
        return True
    root = result.get("root_cause_analysis", "")
    return not root or "Automated analysis failed" in root


async def _get_or_create_error_log(
    sqs_message_id: str,
    workspace_id: str,
    service_name: str,
    raw_log: str,
) -> tuple[ErrorLog, bool]:
    """
    Returns (error_log, is_already_complete).
    Reuses the existing MongoDB document when SQS redelivers the same message,
    preventing duplicate rows on retry.
    """
    existing = await ErrorLog.find_one(ErrorLog.sqs_message_id == sqs_message_id)
    if existing:
        if existing.status == "analyzed":
            print(
                f"⏭️  [Worker] Message [{sqs_message_id}] already analyzed (log {existing.id}). Skipping."
            )
            return existing, True
        print(
            f"♻️  [Worker] Resuming existing log {existing.id} (status={existing.status})"
        )
        return existing, False

    log = ErrorLog(
        sqs_message_id=sqs_message_id,
        workspace_id=workspace_id,
        service_name=service_name,
        raw_log=raw_log,
        status="pending",
    )
    await log.insert()
    print(f"💾 Log saved to MongoDB Atlas with ID: {log.id}")
    return log, False


async def _delete_sqs_message(receipt_handle: str, msg_id: str) -> None:
    for attempt in range(3):
        try:
            await asyncio.to_thread(
                sqs_client.delete_message,
                QueueUrl=QUEUE_URL,
                ReceiptHandle=receipt_handle,
            )
            print(f"✅ [Worker {WORKER_ID}] Message [{msg_id}] deleted from queue.")
            return
        except Exception as e:
            if attempt < 2:
                print(
                    f"⚠️  [Worker {WORKER_ID}] Delete attempt {attempt + 1} failed: {e}. Retrying..."
                )
                await asyncio.sleep(1)
            else:
                print(
                    f"❌ [Worker {WORKER_ID}] Failed to delete message [{msg_id}]: {e}"
                )


async def _mark_permanently_failed(sqs_message_id: str) -> None:
    log = await ErrorLog.find_one(ErrorLog.sqs_message_id == sqs_message_id)
    if log and log.status != "analyzed":
        log.status = "permanently_failed"
        await log.save()
        print(f"   MongoDB log {log.id} marked as permanently_failed.")


# ── Message Processor ─────────────────────────────────────────────────────────


async def process_message(body: dict, sqs_message_id: str) -> None:
    workspace_id = body.get("workspace_id")
    service_name = body.get("service_name")
    raw_log = body.get("raw_log")

    print(f"\n📥 [Worker] Processing trace from service: {service_name}")

    workspace = await Workspace.find_one(Workspace.workspace_id == workspace_id)
    if not workspace:
        workspace = Workspace(workspace_id=workspace_id)
        await workspace.insert()
        print(f"✨ Created new cloud workspace reference: {workspace_id}")

    log, already_complete = await _get_or_create_error_log(
        sqs_message_id, workspace_id, service_name, raw_log
    )
    if already_complete:
        return

    print(f"🧠 [Worker] Dispatching payload to Groq inference engine...")

    ai_result = None
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            ai_result = await asyncio.to_thread(
                analyze_stack_trace, service_name, raw_log
            )

            if not _is_fallback_analysis(ai_result):
                print(f"✨ [Worker] Groq analysis succeeded on attempt {attempt}.")
                break

            last_error = "Groq returned a fallback response."
            print(f"⚠️  [Worker] Fallback response received.")

        except Exception as e:
            last_error = str(e)
            print(f"⚠️  [Worker] Groq error on attempt {attempt}: {last_error}")

        if attempt < MAX_RETRIES:
            wait = 2**attempt
            print(f"   Retrying in {wait}s... ({attempt + 1}/{MAX_RETRIES})")
            await asyncio.sleep(wait)

    if _is_fallback_analysis(ai_result):
        log.status = "failed"
        await log.save()
        print(
            f"❌ [Worker] Analysis failed after {MAX_RETRIES} retries. Error: {last_error}"
        )
        raise Exception(f"Analysis failed: {last_error}")

    log.root_cause_analysis = ai_result.get("root_cause_analysis")
    log.actionable_fix = ai_result.get("actionable_fix")
    log.status = "analyzed"
    await log.save()
    print(f"✅ [Worker] Log processing complete. Document marked as 'analyzed'.")


# ── SQS Polling Loop ──────────────────────────────────────────────────────────


async def start_worker():
    await init_db()
    print(f"🚀 Incident Consumer [{WORKER_ID}] live. Polling: {QUEUE_URL}...")
    print(f"   Worker started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Max SQS delivery attempts per message: {MAX_SQS_DELIVERIES}")

    empty_polls = 0

    while True:
        try:
            response = await asyncio.to_thread(
                sqs_client.receive_message,
                QueueUrl=QUEUE_URL,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,
                VisibilityTimeout=VISIBILITY_TIMEOUT,
                MessageAttributeNames=["All"],
                AttributeNames=["ApproximateReceiveCount"],
            )

            messages = response.get("Messages", [])
            if not messages:
                empty_polls += 1
                if empty_polls % 5 == 1:
                    print(
                        f"[Worker {WORKER_ID}] Queue empty. Listening for stack traces... (empty polls: {empty_polls})"
                    )
                continue

            empty_polls = 0

            for msg in messages:
                msg_id = msg["MessageId"]
                receipt = msg["ReceiptHandle"]
                delivery = int(
                    msg.get("Attributes", {}).get("ApproximateReceiveCount", 1)
                )

                try:
                    body = json.loads(msg["Body"])
                    print(
                        f"\n📥 [Worker {WORKER_ID}] Received message [{msg_id}] (SQS delivery {delivery}/{MAX_SQS_DELIVERIES})"
                    )

                    if delivery > MAX_SQS_DELIVERIES:
                        print(
                            f"⚠️  [Worker {WORKER_ID}] Message [{msg_id}] exceeded max deliveries. Dropping."
                        )
                        await _mark_permanently_failed(msg_id)
                        await _delete_sqs_message(receipt, msg_id)
                        continue

                    await process_message(body, sqs_message_id=msg_id)
                    await _delete_sqs_message(receipt, msg_id)

                except json.JSONDecodeError as e:
                    print(f"❌ [Worker {WORKER_ID}] Failed to parse message body: {e}")
                    await _delete_sqs_message(receipt, msg_id)

                except Exception as e:
                    print(
                        f"❌ [Worker {WORKER_ID}] Processing failed for [{msg_id}] (delivery {delivery}/{MAX_SQS_DELIVERIES}): {e}"
                    )
                    if delivery >= MAX_SQS_DELIVERIES:
                        print(
                            f"   Final delivery attempt — removing message from queue."
                        )
                        await _mark_permanently_failed(msg_id)
                        await _delete_sqs_message(receipt, msg_id)
                    else:
                        print(
                            f"   Message returns to queue after visibility timeout ({VISIBILITY_TIMEOUT}s)."
                        )
                        await asyncio.sleep(2)

        except Exception as e:
            print(
                f"🚨 [Worker {WORKER_ID}] Polling failure: {e}. Reconnecting in 10s..."
            )
            await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(start_worker())
