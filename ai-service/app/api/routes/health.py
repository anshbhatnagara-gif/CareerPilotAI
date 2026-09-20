from fastapi import APIRouter
from app.schemas.health import HealthResponse, DependencyHealthResponse
from app.config import get_settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, status_code=200)
def get_health():
    settings = get_settings()
    return HealthResponse(
        success=True,
        service=settings.SERVICE_NAME,
        message="CareerPilot AI service is running"
    )


@router.get("/health/dependencies", response_model=DependencyHealthResponse, status_code=200)
def get_dependency_health():
    settings = get_settings()
    is_gemini_configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    return DependencyHealthResponse(
        success=True,
        service=settings.SERVICE_NAME,
        dependencies={
            "configuration": "ready",
            "gemini": {
                "configured": is_gemini_configured,
                "model": settings.GEMINI_MODEL
            }
        }
    )
