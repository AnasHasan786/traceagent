from pydantic import BaseModel, Field

class IncidentIngest(BaseModel):
    workspace_id: str = Field(..., min_length=3, description="Unique identifier for the engineering workspace")
    service_name: str = Field(..., description="Name of the microservice throwing the error")
    raw_log: str = Field(..., min_length=10, description="The unhandled exception or stack trace text")