import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.incident import Workspace, ErrorLog

async def init_db():
    """
    Initializes the async Motor driver connection and maps the 
    Beanie ODM document schemas to the live MongoDB collections.
    """
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError("CRITICAL: MONGO_URI missing from environment variables!")
        
    # Create the single-thread async client connection
    client = AsyncIOMotorClient(mongo_uri)
    
    # Extract database name from connection string or default
    db_name = mongo_uri.split("/")[-1].split("?")[0] or "trace_agent_db"
    
    # Bind models to the engine loop using the client directly, not the database
    await init_beanie(
        database=client[db_name],
        document_models=[Workspace, ErrorLog]
    )
    print(f"🔌 [Database] Async connection established with MongoDB Atlas cluster [{db_name}].")