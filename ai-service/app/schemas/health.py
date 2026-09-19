from pydantic import BaseModel
from typing import Dict, Any


class HealthResponse(BaseModel):
    success: bool
    service: str
    message: str


class DependencyHealthResponse(BaseModel):
    success: bool
    service: str
    dependencies: Dict[str, Any]
