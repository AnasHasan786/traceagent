#!/usr/bin/env python
"""
Utility script to purge and reset the SQS queue.
This clears all in-flight messages and stuck messages.
"""
import os
import boto3
from dotenv import load_dotenv

load_dotenv()

QUEUE_URL = os.getenv("SQS_QUEUE_URL")


def _get_sqs_client():
    return boto3.client(
        "sqs",
        region_name=os.getenv("AWS_REGION"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )


def purge_queue():
    """Purge all messages from the queue."""
    try:
        print(f"🧹 Purging queue: {QUEUE_URL}")
        _get_sqs_client().purge_queue(QueueUrl=QUEUE_URL)
        print("✅ Queue purged successfully. All in-flight and queued messages cleared.")
        print("⏳ Note: Purge can take up to 60 seconds to take full effect in AWS.")
    except Exception as e:
        print(f"❌ Failed to purge queue: {str(e)}")

def check_queue_status():
    """Check current queue attributes."""
    try:
        attrs = _get_sqs_client().get_queue_attributes(
            QueueUrl=QUEUE_URL,
            AttributeNames=["ApproximateNumberOfMessages", "ApproximateNumberOfMessagesNotVisible"]
        )
        visible = attrs["Attributes"]["ApproximateNumberOfMessages"]
        not_visible = attrs["Attributes"]["ApproximateNumberOfMessagesNotVisible"]
        print(f"\n📊 Queue Status:")
        print(f"   Visible Messages: {visible}")
        print(f"   In-Flight (Not Visible): {not_visible}")
    except Exception as e:
        print(f"❌ Failed to get queue status: {str(e)}")

if __name__ == "__main__":
    import sys

    print("🔄 SQS Queue Management Tool")
    print("-" * 50)
    check_queue_status()

    if len(sys.argv) > 1 and sys.argv[1] == "--purge":
        print("\n" + "-" * 50)
        purge_queue()
        print("\n" + "-" * 50)
        print("✨ Queue purged. You can now safely restart the worker.")
    else:
        print("\nTo clear all queued messages, run: python purge_queue.py --purge")
