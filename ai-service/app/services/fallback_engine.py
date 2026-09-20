from typing import Optional, List
from app.schemas.analyze import (
    CareerProfile,
    CareerAnalysisData,
    SkillAnalysisData,
    LearningRecommendationData,
    SkillPriorityItem,
    LearningRecommendationItem
)


class FallbackEngine:
    """
    Deterministic Fallback Engine for CareerPilot AI.
    Produces complete, structured analysis data when Gemini API is unconfigured,
    times out, returns errors, or produces unparsable responses.
    Explicitly sets status='fallback' to maintain source-of-truth integrity.
    """

    @staticmethod
    def analyze_career_profile(profile: CareerProfile) -> CareerAnalysisData:
        target = profile.targetCareer or "Software Developer"
        exp = profile.experienceLevel or "Entry Level"
        skills = profile.skills if profile.skills else ["Programming Basics"]
        interests = profile.interests if profile.interests else ["Software Engineering"]

        strengths = [s for s in skills[:5]]
        if not strengths:
            strengths = ["Problem Solving", "Adaptability"]

        focus_areas = ["System Design", "Cloud Infrastructure", "Data Structures"]
        career_advice = [
            f"Focus on building core proficiency in {target} fundamentals.",
            "Complete end-to-end practical projects to validate skills.",
            "Establish portfolio evidence on GitHub to showcase implementation."
        ]

        return CareerAnalysisData(
            status="fallback",
            career_direction=f"Deterministic roadmap for target career as {target} ({exp}).",
            profile_summary=f"Candidate with {len(skills)} verified skills interested in {', '.join(interests[:3])}.",
            strengths=strengths,
            focus_areas=focus_areas,
            career_advice=career_advice,
            confidence_level="High" if len(skills) >= 3 else "Medium"
        )

    @staticmethod
    def generate_skill_insights(profile: CareerProfile, target_skills: Optional[List[str]] = None) -> SkillAnalysisData:
        target = profile.targetCareer or "Software Developer"
        current = profile.skills if profile.skills else ["Programming Basics"]

        # Expected skill sets per career domain
        standard_required = ["Data Structures & Algorithms", "Git", "REST APIs", "Database Management"]
        if target_skills:
            required = list(dict.fromkeys(standard_required + target_skills))
        else:
            required = standard_required

        missing = [s for s in required if s not in current]

        priorities = []
        for s in missing:
            priorities.append(SkillPriorityItem(
                skill=s,
                priority="HIGH" if "Data Structures" in s or "Git" in s else "MEDIUM",
                reason=f"Essential core competency for {target} role."
            ))

        return SkillAnalysisData(
            status="fallback",
            target_career=target,
            current_skills=current,
            required_skills=required,
            missing_skills=missing,
            skill_priorities=priorities,
            summary=f"Identified {len(missing)} priority skill gap areas for {target} readiness."
        )

    @staticmethod
    def generate_learning_recommendations(profile: CareerProfile, focus_areas: Optional[List[str]] = None) -> LearningRecommendationData:
        target = profile.targetCareer or "Software Developer"
        focuses = focus_areas if focus_areas else ["Core Foundations", "Advanced Concepts", "Portfolio Projects"]

        learning_order = [
            "Stage 1: Core Technical Foundations",
            "Stage 2: Architecture & System Design",
            "Stage 3: Portfolio Implementation & Interview Prep"
        ]

        recommendations = [
            LearningRecommendationItem(
                topic=focuses[0] if len(focuses) > 0 else "Algorithms & Data Structures",
                stage="Stage 1",
                estimated_hours="15-20 hours",
                resources=["Documentation", "Interactive Practice"]
            ),
            LearningRecommendationItem(
                topic=focuses[1] if len(focuses) > 1 else "API & Database Design",
                stage="Stage 2",
                estimated_hours="20-25 hours",
                resources=["Project Guided Tutorials", "Reference Guides"]
            )
        ]

        return LearningRecommendationData(
            status="fallback",
            learning_order=learning_order,
            recommendations=recommendations,
            estimated_focus="6-8 hours / week",
            next_steps=[
                "Complete foundational exercises in missing skill domains.",
                "Implement a portfolio project demonstrating REST API & database design."
            ],
            summary=f"Structured 3-stage learning pathway tailored for {target} preparation."
        )
