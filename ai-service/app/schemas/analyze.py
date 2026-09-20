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


# --------------------------------------------------
# Structured Output Schemas (AI / Fallback)
# --------------------------------------------------

class CareerAnalysisData(BaseModel):
    status: str = Field(description="ai_generated or fallback")
    career_direction: str = Field(description="Summary of target career trajectory")
    profile_summary: str = Field(description="Overview of candidate profile")
    strengths: List[str] = Field(default_factory=list, description="Key candidate strengths")
    focus_areas: List[str] = Field(default_factory=list, description="Priority growth areas")
    career_advice: List[str] = Field(default_factory=list, description="Actionable career recommendations")
    confidence_level: str = Field(description="High, Medium, or Low")


class SkillPriorityItem(BaseModel):
    skill: str
    priority: str  # HIGH, MEDIUM, LOW
    reason: str


class SkillAnalysisData(BaseModel):
    status: str = Field(description="ai_generated or fallback")
    target_career: str = Field(description="Target career role analyzed")
    current_skills: List[str] = Field(default_factory=list, description="Current skills verified")
    required_skills: List[str] = Field(default_factory=list, description="Core required skills for target career")
    missing_skills: List[str] = Field(default_factory=list, description="Skills gap identified")
    skill_priorities: List[SkillPriorityItem] = Field(default_factory=list, description="Prioritized skills list")
    summary: str = Field(description="Overall skill gap assessment summary")


class LearningRecommendationItem(BaseModel):
    topic: str
    stage: str
    estimated_hours: str
    resources: List[str] = Field(default_factory=list)


class LearningRecommendationData(BaseModel):
    status: str = Field(description="ai_generated or fallback")
    learning_order: List[str] = Field(default_factory=list, description="Recommended learning stage sequence")
    recommendations: List[LearningRecommendationItem] = Field(default_factory=list, description="Actionable learning modules")
    estimated_focus: str = Field(description="Estimated weekly study effort")
    next_steps: List[str] = Field(default_factory=list, description="Immediate next steps")
    summary: str = Field(description="Overall learning roadmap summary")


class AnalysisResponse(BaseModel):
    success: bool
    service: str
    status: str  # "ai_generated" or "fallback"
    message: str
    data: Optional[Dict[str, Any]] = None
