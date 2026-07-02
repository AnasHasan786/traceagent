import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.incident import Workspace, ErrorLog
from app.models.user import User
from app.models.otp import OTPRecord

async def init_db():
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError("CRITICAL: MONGO_URI missing from environment variables!")

    client  = AsyncIOMotorClient(mongo_uri)
    db_name = mongo_uri.split("/")[-1].split("?")[0] or "trace_agent_db"

    await init_beanie(
        database=client[db_name],
        document_models=[User, Workspace, ErrorLog, OTPRecord]
    )
    print(f"🔌 [Database] Async connection established with MongoDB Atlas cluster [{db_name}].")