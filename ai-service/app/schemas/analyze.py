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


class SkillPriorityGap(BaseModel):
    skill: str
    priority: str  # HIGH, MEDIUM, LOW
    reason: str


# Legacy alias for backward compatibility
SkillPriorityItem = SkillPriorityGap


class LearningPriority(BaseModel):
    skill: str
    priority: str  # HIGH, MEDIUM, LOW
    reason: str


class LearningStep(BaseModel):
    order: int
    skill: str
    topics: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    practice_focus: List[str] = Field(default_factory=list)
    estimated_effort: str  # LOW, MEDIUM, HIGH


# Legacy alias for backward compatibility
LearningRecommendationItem = LearningStep


class LearningRecommendationRequest(BaseModel):
    profile: CareerProfile
    missingSkills: Optional[List[str]] = Field(default_factory=list, description="Missing skills from gap analysis")
    developingSkills: Optional[List[str]] = Field(default_factory=list, description="Developing skills from gap analysis")
    priorityGaps: Optional[List[SkillPriorityGap]] = Field(default_factory=list, description="Priority gaps from skill analysis")
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
