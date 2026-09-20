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
        skills = profile.skills if profile.skills else []
        interests = profile.interests if profile.interests else []

        # Education summary
        edu_desc = ""
        if profile.education and (profile.education.degree or profile.education.branch):
            deg = profile.education.degree or "Degree"
            br = profile.education.branch or "Field"
            edu_desc = f" taking {deg} in {br}"

        loc_desc = f" based in {profile.personal.location}" if profile.personal and profile.personal.location else ""

        # Determine strengths based strictly on profile skills
        strengths = []
        if skills:
            strengths = [f"Exposure to {s}" for s in skills[:4]]
        else:
            strengths = ["Interest in technical skill development", "Self-motivated learning mindset"]

        if interests:
            strengths.append(f"Interest in {interests[0]}")

        focus_areas = [
            f"Core proficiency in {target} fundamentals",
            "Practical project building and portfolio evidence",
            "Data structures, algorithms, and system design"
        ]

        career_advice = [
            f"Build a strong practical foundation aligned with {target} requirements.",
            "Complete end-to-end portfolio projects and document code on GitHub.",
            "Practice technical communication and domain-specific problem solving."
        ]

        # Calculate confidence level based on profile completeness
        has_skills = len(skills) > 0
        has_edu = bool(profile.education and (profile.education.degree or profile.education.branch))
        has_target = bool(profile.targetCareer)

        if has_skills and has_edu and has_target:
            confidence = "HIGH"
        elif has_target and (has_skills or has_edu):
            confidence = "MODERATE"
        else:
            confidence = "LOW"

        return CareerAnalysisData(
            status="fallback",
            career_direction=f"Career path alignment targeting {target} ({exp}){edu_desc}{loc_desc}.",
            profile_summary=f"Candidate with {len(skills)} verified skills interested in {target} roles.",
            strengths=strengths,
            focus_areas=focus_areas,
            career_advice=career_advice,
            confidence_level=confidence
        )

    @staticmethod
    def generate_skill_insights(profile: CareerProfile, target_skills: Optional[List[str]] = None) -> SkillAnalysisData:
        target = profile.targetCareer or "Software Developer"
        current = profile.skills if profile.skills else ["Programming Basics"]

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
