from typing import Optional, List, Dict, Any
from app.schemas.analyze import CareerProfile, AnalysisResponse
from app.providers.gemini import GeminiProvider
from app.services.fallback_engine import FallbackEngine
from app.core.logging import logger
from app.config import get_settings


class AIService:
    """
    CareerPilot AI Service Orchestrator.
    Orchestrates requests between active AI Model Provider (Gemini) and FallbackEngine.
    Ensures safe execution, timeout protection, status classification ('ai_generated' vs 'fallback'),
    and graceful fallback activation.
    """

    def __init__(self, provider=None):
        self.provider = provider if provider is not None else GeminiProvider()

    def analyze_career_profile(self, profile: CareerProfile) -> AnalysisResponse:
        logger.info(f"Processing career analysis request for target career: '{profile.targetCareer}'")
        
        # 1. Attempt Gemini Provider execution if configured
        ai_data = None
        if hasattr(self.provider, "is_configured") and self.provider.is_configured():
            try:
                ai_data = self.provider.analyze_career_profile(profile)
            except Exception as e:
                logger.warning(f"Provider analyze_career_profile exception: {type(e).__name__}")
                ai_data = None

        # 2. Fallback Engine execution if provider unconfigured or failed
        if ai_data is not None:
            data_dict = ai_data.model_dump()
            return AnalysisResponse(
                success=True,
                service="careerpilot-ai-service",
                status="ai_generated",
                message="AI career profile analysis generated successfully via Gemini",
                data=data_dict
            )

        fallback_data = FallbackEngine.analyze_career_profile(profile)
        return AnalysisResponse(
            success=True,
            service="careerpilot-ai-service",
            status="fallback",
            message="Deterministic career analysis generated via fallback engine",
            data=fallback_data.model_dump()
        )

    def generate_skill_insights(self, profile: CareerProfile, target_skills: Optional[List[str]] = None) -> AnalysisResponse:
        logger.info(f"Processing skill insights request for skills count: {len(profile.skills)}")
        
        ai_data = None
        if hasattr(self.provider, "is_configured") and self.provider.is_configured():
            try:
                ai_data = self.provider.generate_skill_insights(profile, target_skills)
            except Exception as e:
                logger.warning(f"Provider generate_skill_insights exception: {type(e).__name__}")
                ai_data = None

        if ai_data is not None:
            data_dict = ai_data.model_dump()
            return AnalysisResponse(
                success=True,
                service="careerpilot-ai-service",
                status="ai_generated",
                message="AI skill insights generated successfully via Gemini",
                data=data_dict
            )

        fallback_data = FallbackEngine.generate_skill_insights(profile, target_skills)
        return AnalysisResponse(
            success=True,
            service="careerpilot-ai-service",
            status="fallback",
            message="Deterministic skill insights generated via fallback engine",
            data=fallback_data.model_dump()
        )

    def generate_learning_recommendations(self, profile: CareerProfile, focus_areas: Optional[List[str]] = None) -> AnalysisResponse:
        logger.info(f"Processing learning recommendations request for focus areas: {focus_areas}")
        
        ai_data = None
        if hasattr(self.provider, "is_configured") and self.provider.is_configured():
            try:
                ai_data = self.provider.generate_learning_recommendations(profile, focus_areas)
            except Exception as e:
                logger.warning(f"Provider generate_learning_recommendations exception: {type(e).__name__}")
                ai_data = None

        if ai_data is not None:
            data_dict = ai_data.model_dump()
            return AnalysisResponse(
                success=True,
                service="careerpilot-ai-service",
                status="ai_generated",
                message="AI learning recommendations generated successfully via Gemini",
                data=data_dict
            )

        fallback_data = FallbackEngine.generate_learning_recommendations(profile, focus_areas)
        return AnalysisResponse(
            success=True,
            service="careerpilot-ai-service",
            status="fallback",
            message="Deterministic learning recommendations generated via fallback engine",
            data=fallback_data.model_dump()
        )


_ai_service_instance = AIService()


def get_ai_service() -> AIService:
    return _ai_service_instance
