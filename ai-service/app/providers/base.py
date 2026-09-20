from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from app.schemas.analyze import CareerProfile, CareerAnalysisData, SkillAnalysisData, LearningRecommendationData


class BaseAIProvider(ABC):
    """
    Abstract Base Class for AI Model Providers.
    Decouples AI integration from specific LLM vendors (Gemini, OpenAI, etc.).
    """

    @abstractmethod
    def analyze_career_profile(self, profile: CareerProfile) -> Optional[CareerAnalysisData]:
        """Analyze career profile and return structured career direction insights."""
        pass

    @abstractmethod
    def generate_skill_insights(self, profile: CareerProfile, target_skills: Optional[List[str]] = None) -> Optional[SkillAnalysisData]:
        """Perform skill gap analysis and return structured skill priorities."""
        pass

    @abstractmethod
    def generate_learning_recommendations(
        self,
        profile: CareerProfile,
        focus_areas: Optional[List[str]] = None,
        missing_skills: Optional[List[str]] = None,
        developing_skills: Optional[List[str]] = None,
        priority_gaps: Optional[List[SkillPriorityGap]] = None
    ) -> Optional[LearningRecommendationData]:
        """Generate structured learning path and action recommendations."""
        pass

