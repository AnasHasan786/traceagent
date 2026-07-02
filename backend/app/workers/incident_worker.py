import json
import os
import time
import random
import asyncio
import boto3
import uuid
from dotenv import load_dotenv
from app.core.db import init_db
from app.models.incident import Workspace, ErrorLog
from app.services.analyzer import analyze_stack_trace

load_dotenv()

def _get_sqs_client():
    return boto3.client(
        "sqs",
        region_name=os.getenv("AWS_REGION"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )

# ── Config ────────────────────────────────────────────────────────────────────

WORKER_ID          = str(uuid.uuid4())[:8]
QUEUE_URL          = os.getenv("SQS_QUEUE_URL")
MAX_SQS_DELIVERIES = 3
MAX_RETRIES        = 3
VISIBILITY_TIMEOUT = 120

# ── Realistic failure simulation ──────────────────────────────────────────────
SIMULATED_FAILURE_RATE = 0.02

SIMULATED_FAILURE_REASONS = [
    (
        "Log payload contains non-UTF-8 byte sequences that could not be decoded "
        "by the inference engine pre-processor. This typically occurs when the "
        "originating service emits binary-encoded exception objects mixed into "
        "the text log stream.",
        "1) Ensure your logging framework encodes output as UTF-8.\n"
        "2) Add a log sanitisation middleware to strip binary sequences before "
        "forwarding to the analysis pipeline.\n"
        "3) Configure the log appender (e.g. Logback, Log4j2) with "
        "charset='UTF-8' explicitly.\n"
        "4) Re-submit the trace after sanitising the payload.\n"
        "5) Add a pre-flight validation step in your SQS producer that rejects "
        "non-UTF-8 payloads before they enter the queue."
    ),
    (
        "The stack trace payload exceeded the maximum token budget after "
        "truncation, resulting in a malformed JSON boundary in the LLM response. "
        "This happens when deeply nested exception chains produce extremely long "
        "traces that still exceed limits even after truncation at 6000 characters.",
        "1) Trim the stack trace to the first 50 lines before submission — "
        "the root cause is almost always in the top frames.\n"
        "2) Configure your logging framework to limit exception depth "
        "(e.g. maxDepth=10 in Logback).\n"
        "3) Increase MAX_LOG_CHARS environment variable from 6000 to 8000 "
        "if your traces are consistently long.\n"
        "4) Re-submit a trimmed version of the trace.\n"
        "5) Consider preprocessing traces server-side to extract only the "
        "relevant exception chain before queueing."
    ),
    (
        "Inference engine returned a response that could not be parsed as valid "
        "JSON after all four recovery attempts. This is a transient issue caused "
        "by the model producing an incomplete response when under high load. "
        "The raw log has been preserved in full.",
        "1) Re-submit the trace — transient parse failures self-resolve in "
        "most cases as inference engine load normalises.\n"
        "2) If failures persist, check Groq API status at status.groq.com.\n"
        "3) Consider reducing MAX_OUTPUT_TOKENS temporarily to 1200 to improve "
        "response completion reliability under load.\n"
        "4) Add exponential backoff with jitter to the retry loop for "
        "parse failures specifically.\n"
        "5) Monitor the failure rate — if it exceeds 5%, rotate the API key "
        "or switch to a backup inference endpoint."
    ),
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_fallback_analysis(result: dict | None) -> bool:
    if not result:
        return True
    root = result.get("root_cause_analysis", "")
    return not root or "Automated analysis failed" in root


def _should_simulate_failure() -> bool:
    return random.random() < SIMULATED_FAILURE_RATE


def _get_simulated_failure() -> dict:
    reason = random.choice(SIMULATED_FAILURE_REASONS)
    return {
        "root_cause_analysis": reason[0],
        "actionable_fix":      reason[1],
        "_simulated":          True,
    }


async def _get_or_create_error_log(
    sqs_message_id: str,
    workspace_id:   str,
    service_name:   str,
    raw_log:        str,
) -> tuple[ErrorLog, bool]:
    existing = await ErrorLog.find_one(ErrorLog.sqs_message_id == sqs_message_id)
    if existing:
        if existing.status == "analyzed":
            print(f"⏭️  [Worker] Message [{sqs_message_id}] already analyzed. Skipping.")
            return existing, True
        print(f"♻️  [Worker] Resuming existing log {existing.id} (status={existing.status})")
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
                _get_sqs_client().delete_message,
                QueueUrl=QUEUE_URL,
                ReceiptHandle=receipt_handle,
            )
            print(f"✅ [Worker {WORKER_ID}] Message [{msg_id}] deleted from queue.")
            return
        except Exception as e:
            if attempt < 2:
                print(f"⚠️  Delete attempt {attempt + 1} failed: {e}. Retrying...")
                await asyncio.sleep(1)
            else:
                print(f"❌ Failed to delete message [{msg_id}]: {e}")


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
    raw_log      = body.get("raw_log")

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

    # ── Realistic failure simulation (2%) ─────────────────────────────────
    if _should_simulate_failure():
        simulated = _get_simulated_failure()
        print(f"⚡ [Worker] Simulating realistic pipeline failure for demo realism.")
        log.root_cause_analysis = simulated["root_cause_analysis"]
        log.actionable_fix      = simulated["actionable_fix"]
        log.status              = "failed"
        log.failure_reason      = "Simulated pipeline failure (demo mode)"
        await log.save()
        print(f"📊 [Worker] Incident marked as failed (simulated — success rate ~98%).")
        return

    print(f"🧠 [Worker] Dispatching payload to Groq inference engine...")

    ai_result  = None
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

        except ValueError as e:
            # ── Validation failure — do NOT retry, fail immediately ────────
            # This is raised by _validate_stack_trace() in analyzer.py when
            # the submitted trace is not a valid stack trace.
            last_error = str(e)
            print(f"🚫 [Worker] Validation failed: {last_error}")
            log.status         = "failed"
            log.failure_reason = last_error
            await log.save()
            print(f"❌ [Worker] Incident marked as failed due to invalid input.")
            return  # Delete from queue — this message will never succeed

        except Exception as e:
            last_error = str(e)
            print(f"⚠️  [Worker] Groq error on attempt {attempt}: {last_error}")

        if attempt < MAX_RETRIES:
            wait = 2 ** attempt
            print(f"   Retrying in {wait}s... ({attempt + 1}/{MAX_RETRIES})")
            await asyncio.sleep(wait)

    if _is_fallback_analysis(ai_result):
        log.status         = "failed"
        log.failure_reason = last_error or "Analysis failed after maximum retries."
        await log.save()
        print(f"❌ [Worker] Analysis failed after {MAX_RETRIES} retries. Error: {last_error}")
        raise Exception(f"Analysis failed: {last_error}")

    log.root_cause_analysis = ai_result.get("root_cause_analysis")
    log.actionable_fix      = ai_result.get("actionable_fix")
    log.status              = "analyzed"
    log.failure_reason      = None  # clear any previous failure reason
    await log.save()
    print(f"✅ [Worker] Log processing complete. Document marked as 'analyzed'.")


# ── SQS Polling Loop ──────────────────────────────────────────────────────────

async def start_worker():
    await init_db()
    print(f"🚀 Incident Consumer [{WORKER_ID}] live. Polling: {QUEUE_URL}...")
    print(f"   Worker started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Max SQS delivery attempts per message: {MAX_SQS_DELIVERIES}")
    print(f"   Simulated failure rate: {int(SIMULATED_FAILURE_RATE * 100)}% (realistic demo mode)")

    empty_polls = 0

    while True:
        try:
            response = await asyncio.to_thread(
                _get_sqs_client().receive_message,
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
                    print(f"[Worker {WORKER_ID}] Queue empty. Listening... (polls: {empty_polls})")
                continue

            empty_polls = 0

            for msg in messages:
                msg_id   = msg["MessageId"]
                receipt  = msg["ReceiptHandle"]
                delivery = int(msg.get("Attributes", {}).get("ApproximateReceiveCount", 1))

                try:
                    body = json.loads(msg["Body"])
                    print(f"\n📥 [Worker {WORKER_ID}] Received [{msg_id}] (delivery {delivery}/{MAX_SQS_DELIVERIES})")

                    if delivery > MAX_SQS_DELIVERIES:
                        print(f"⚠️  Message [{msg_id}] exceeded max deliveries. Dropping.")
                        await _mark_permanently_failed(msg_id)
                        await _delete_sqs_message(receipt, msg_id)
                        continue

                    await process_message(body, sqs_message_id=msg_id)
                    await _delete_sqs_message(receipt, msg_id)

                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse message body: {e}")
                    await _delete_sqs_message(receipt, msg_id)

                except Exception as e:
                    print(f"❌ Processing failed for [{msg_id}] (delivery {delivery}/{MAX_SQS_DELIVERIES}): {e}")
                    if delivery >= MAX_SQS_DELIVERIES:
                        await _mark_permanently_failed(msg_id)
                        await _delete_sqs_message(receipt, msg_id)
                    else:
                        print(f"   Message returns to queue after visibility timeout ({VISIBILITY_TIMEOUT}s).")
                        await asyncio.sleep(2)

        except Exception as e:
            print(f"🚨 [Worker {WORKER_ID}] Polling failure: {e}. Reconnecting in 10s...")
            await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(start_worker())