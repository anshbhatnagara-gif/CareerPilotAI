from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class CareerProfile(BaseModel):
    targetCareer: Optional[str] = Field(default=None, description="Target career role")
    experienceLevel: Optional[str] = Field(default=None, description="Experience level (e.g. Student, Entry Level)")
    skills: List[str] = Field(default_factory=list, description="List of user skills")
    interests: List[str] = Field(default_factory=list, description="List of user career interests")


class CareerAnalysisRequest(BaseModel):
    profile: CareerProfile


class SkillAnalysisRequest(BaseModel):
    profile: CareerProfile
    targetSkills: Optional[List[str]] = Field(default_factory=list, description="Optional target skills for gap analysis")


class LearningRecommendationRequest(BaseModel):
    profile: CareerProfile
    focusAreas: Optional[List[str]] = Field(default_factory=list, description="Optional focus areas for learning path")


class AnalysisResponse(BaseModel):
    success: bool
    service: str
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
