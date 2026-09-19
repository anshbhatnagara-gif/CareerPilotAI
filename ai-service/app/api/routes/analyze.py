from fastapi import APIRouter, Header, HTTPException, status, Depends
from app.schemas.analyze import (
    CareerAnalysisRequest,
    SkillAnalysisRequest,
    LearningRecommendationRequest,
    AnalysisResponse
)
from app.services import AIService, get_ai_service
from app.config import get_settings, Settings

router = APIRouter(prefix="/api/v1/analyze", tags=["Analyze"])


def verify_service_key(
    x_ai_service_key: str = Header(None, alias="X-AI-Service-Key"),
    settings: Settings = Depends(get_settings)
):
    """
    Validates server-to-server request header authentication from Node.js Express API.
    Rejects unauthorized or external direct requests without exposing secrets.
    """
    if not x_ai_service_key or x_ai_service_key != settings.AI_SERVICE_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": "UNAUTHORIZED",
                "message": "Invalid or missing server-to-server authentication key"
            }
        )
    return x_ai_service_key


@router.post("/career", response_model=AnalysisResponse, status_code=200)
def analyze_career(
    payload: CareerAnalysisRequest,
    _: str = Depends(verify_service_key),
    ai_service: AIService = Depends(get_ai_service)
):
    return ai_service.analyze_career_profile(payload.profile)


@router.post("/skills", response_model=AnalysisResponse, status_code=200)
def analyze_skills(
    payload: SkillAnalysisRequest,
    _: str = Depends(verify_service_key),
    ai_service: AIService = Depends(get_ai_service)
):
    return ai_service.generate_skill_insights(payload.profile, payload.targetSkills)


@router.post("/learning", response_model=AnalysisResponse, status_code=200)
def analyze_learning(
    payload: LearningRecommendationRequest,
    _: str = Depends(verify_service_key),
    ai_service: AIService = Depends(get_ai_service)
):
    return ai_service.generate_learning_recommendations(payload.profile, payload.focusAreas)
