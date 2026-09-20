from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class PersonalInfo(BaseModel):
    fullName: Optional[str] = Field(default=None, description="Full name of user")
    location: Optional[str] = Field(default=None, description="Location of user")


class EducationInfo(BaseModel):
    college: Optional[str] = Field(default=None, description="College or university")
    degree: Optional[str] = Field(default=None, description="Degree program")
    branch: Optional[str] = Field(default=None, description="Field of study or branch")
    currentYear: Optional[str] = Field(default=None, description="Current academic year")
    graduationYear: Optional[str] = Field(default=None, description="Expected graduation year")


class CareerProfile(BaseModel):
    targetCareer: Optional[str] = Field(default=None, description="Target career role")
    experienceLevel: Optional[str] = Field(default=None, description="Experience level (e.g. Student, Entry Level)")
    goal: Optional[str] = Field(default=None, description="Primary career goal")
    skills: List[str] = Field(default_factory=list, description="List of user skills")
    interests: List[str] = Field(default_factory=list, description="List of user career interests")
    personal: Optional[PersonalInfo] = Field(default=None, description="Personal information")
    education: Optional[EducationInfo] = Field(default=None, description="Education background")


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
    confidence_level: str = Field(description="LOW, MODERATE, or HIGH")


class SkillPriorityGap(BaseModel):
    skill: str
    priority: str  # HIGH, MEDIUM, LOW
    reason: str


# Legacy alias for backward compatibility
SkillPriorityItem = SkillPriorityGap


class SkillAnalysisData(BaseModel):
    status: str = Field(description="ai_generated or fallback")
    target_career: str = Field(description="Target career role analyzed")
    required_skills: List[str] = Field(default_factory=list, description="Core required skills for target career")
    matched_skills: List[str] = Field(default_factory=list, description="Candidate skills aligned with target career")
    developing_skills: List[str] = Field(default_factory=list, description="Skills where candidate has partial/basic exposure")
    missing_skills: List[str] = Field(default_factory=list, description="Relevant skills not present in user profile")
    priority_gaps: List[SkillPriorityGap] = Field(default_factory=list, description="Top priority skill gaps to address")
    skill_gap_summary: str = Field(description="Overall skill gap assessment summary")
    confidence_level: str = Field(description="LOW, MODERATE, or HIGH")


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
