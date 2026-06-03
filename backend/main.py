from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routers import ingest

app = FastAPI(
    title="Incident Ingestion API",
    description="Asynchronous ingestion pipeline for system stack traces.",
    version="1.0.0"
)

# Defining CORS origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "pipeline": "operational"}

