from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class PersonalInfo(BaseModel):
    fullName: Optional[str] = Field(default=None, max_length=120, description="Full name of user")
    location: Optional[str] = Field(default=None, max_length=160, description="Location of user")


class EducationInfo(BaseModel):
    college: Optional[str] = Field(default=None, max_length=200, description="College or university")
    degree: Optional[str] = Field(default=None, max_length=100, description="Degree program")
    branch: Optional[str] = Field(default=None, max_length=160, description="Field of study or branch")
    currentYear: Optional[str] = Field(default=None, max_length=50, description="Current academic year")
    graduationYear: Optional[str] = Field(default=None, max_length=50, description="Expected graduation year")


class CareerProfile(BaseModel):
    targetCareer: Optional[str] = Field(default=None, max_length=120, description="Target career role")
    experienceLevel: Optional[str] = Field(default=None, max_length=50, description="Experience level (e.g. Student, Entry Level)")
    goal: Optional[str] = Field(default=None, max_length=1000, description="Primary career goal")
    skills: List[str] = Field(default_factory=list, max_length=50, description="List of user skills")
    interests: List[str] = Field(default_factory=list, max_length=50, description="List of user career interests")
    personal: Optional[PersonalInfo] = Field(default=None, description="Personal information")
    education: Optional[EducationInfo] = Field(default=None, description="Education background")


class CareerAnalysisRequest(BaseModel):
    profile: CareerProfile


class SkillAnalysisRequest(BaseModel):
    profile: CareerProfile
    targetSkills: Optional[List[str]] = Field(default_factory=list, max_length=50, description="Optional target skills for gap analysis")


class SkillPriorityGap(BaseModel):
    skill: str = Field(max_length=120)
    priority: str = Field(max_length=20)  # HIGH, MEDIUM, LOW
    reason: str = Field(max_length=500)


# Legacy alias for backward compatibility
SkillPriorityItem = SkillPriorityGap


class LearningPriority(BaseModel):
    skill: str = Field(max_length=120)
    priority: str = Field(max_length=20)  # HIGH, MEDIUM, LOW
    reason: str = Field(max_length=500)


class LearningStep(BaseModel):
    order: int
    skill: str = Field(max_length=120)
    topics: List[str] = Field(default_factory=list, max_length=20)
    prerequisites: List[str] = Field(default_factory=list, max_length=20)
    practice_focus: List[str] = Field(default_factory=list, max_length=20)
    estimated_effort: str = Field(max_length=20)  # LOW, MEDIUM, HIGH


# Legacy alias for backward compatibility
LearningRecommendationItem = LearningStep


class LearningRecommendationRequest(BaseModel):
    profile: CareerProfile
    missingSkills: Optional[List[str]] = Field(default_factory=list, max_length=50, description="Missing skills from gap analysis")
    developingSkills: Optional[List[str]] = Field(default_factory=list, max_length=50, description="Developing skills from gap analysis")
    priorityGaps: Optional[List[SkillPriorityGap]] = Field(default_factory=list, max_length=50, description="Priority gaps from skill analysis")
    focusAreas: Optional[List[str]] = Field(default_factory=list, max_length=50, description="Optional focus areas for learning path")


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


class LearningRecommendationData(BaseModel):
    status: str = Field(description="ai_generated or fallback")
    target_career: str = Field(description="Target career role analyzed")
    learning_priorities: List[LearningPriority] = Field(default_factory=list, description="Prioritized skill learning objectives")
    learning_sequence: List[LearningStep] = Field(default_factory=list, description="Ordered step-by-step learning progression")
    recommended_topics: List[str] = Field(default_factory=list, description="Structured key learning topics")
    practice_focus: List[str] = Field(default_factory=list, description="Hands-on practice & project focus areas")
    learning_summary: str = Field(description="Summary narrative of learning roadmap")
    confidence_level: str = Field(description="LOW, MODERATE, or HIGH")


class AnalysisResponse(BaseModel):
    success: bool
    service: str
    status: str  # "ai_generated" or "fallback"
    message: str
    data: Optional[Dict[str, Any]] = None
