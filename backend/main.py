from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routers import auth, ingest, password
from app.core.db import init_db
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Initializing Database Connection with Beanie ODM...")
    await init_db()
    yield
    print("🛑 Shutting down server...")

app = FastAPI(
    title="Incident Ingestion API",
    description="Asynchronous ingestion pipeline for system stack traces.",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/api/v1")
app.include_router(ingest.router,   prefix="/api/v1")
app.include_router(password.router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "pipeline": "operational"}