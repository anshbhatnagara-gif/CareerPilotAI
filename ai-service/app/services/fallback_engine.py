from typing import Optional, List, Dict, Set
from app.schemas.analyze import (
    CareerProfile,
    CareerAnalysisData,
    SkillAnalysisData,
    LearningRecommendationData,
    SkillPriorityGap,
    LearningRecommendationItem
)


# Deterministic career skill specifications map for common technical careers
CAREER_SKILL_SPECS: Dict[str, List[str]] = {
    "AI/ML Engineer": [
        "Python", "Statistics & Probability", "Machine Learning", "Data Handling (Pandas/NumPy)",
        "SQL", "Model Evaluation & Metrics", "Deep Learning Frameworks", "ML Pipeline Design"
    ],
    "Frontend Developer": [
        "HTML5 & CSS3", "JavaScript (ES6+)", "DOM Manipulation", "Responsive Web Design",
        "Frontend Framework (React)", "TypeScript", "REST API Consumption", "Web Performance Optimization"
    ],
    "Backend Developer": [
        "Server-Side Programming", "RESTful API Design", "Database Management (SQL/NoSQL)",
        "Authentication & Security", "HTTP Protocols & Caching", "System Architecture", "Git & Version Control"
    ],
    "Software Engineer": [
        "Programming Fundamentals", "Data Structures & Algorithms", "Object-Oriented Design",
        "Git & Version Control", "Database Fundamentals", "Testing & Debugging", "Software Architecture"
    ],
    "Data Scientist": [
        "Python / R", "Statistics & Linear Algebra", "Data Analysis (Pandas)", "Data Visualization",
        "SQL & Querying", "Machine Learning Algorithms", "Exploratory Data Analysis"
    ],
    "DevOps Engineer": [
        "Linux Administration", "CI/CD Pipelines", "Containerization (Docker)", "Cloud Infrastructure (GCP/AWS)",
        "Kubernetes & Orchestration", "Shell Scripting", "Infrastructure as Code"
    ],
    "Full Stack Developer": [
        "HTML/CSS & JavaScript", "Frontend Framework (React)", "Node.js & Express", "Database Design (SQL)",
        "REST API Development", "Git & Version Control", "Authentication & Web Security"
    ],
    "Mobile App Developer": [
        "Mobile UI Design", "App Lifecycle Management", "Cross-Platform Framework (React Native/Flutter)",
        "REST API Integration", "Local Data Persistence", "State Management"
    ],
    "Data Engineer": [
        "Advanced SQL", "Data Warehousing (BigQuery/Snowflake)", "ETL/ELT Pipeline Design",
        "Python / Scala", "Data Modeling", "Cloud Storage & Data Lakes"
    ],
    "Cybersecurity Specialist": [
        "Network Security & Protocols", "Vulnerability Assessment", "Linux Administration",
        "Encryption & Cryptography", "Identity & Access Management (IAM)", "Security Auditing"
    ],
    "Cloud Engineer": [
        "Cloud Architecture (GCP/AWS)", "Networking & VPC", "Identity & Access Management (IAM)",
        "Serverless Computing", "Cloud Storage & Security", "Monitoring & Logging"
    ]
}

# Generic fallback skill spec for unlisted target careers
DEFAULT_SKILL_SPEC = [
    "Domain Programming", "Data Structures & Algorithms", "Database Management",
    "Version Control (Git)", "API Integration", "Testing & Quality Assurance"
]


class FallbackEngine:
    """
    Deterministic Fallback Engine for CareerPilot AI.
    Produces complete, structured analysis data when Gemini API is unconfigured,
    times out, returns errors, or produces unparsable responses.
    Explicitly sets status='fallback' to maintain source-of-truth integrity.
    """

    @staticmethod
    def _normalize_skill(skill: str) -> str:
        """Case-insensitive skill name normalization."""
        return skill.strip().lower() if skill else ""

    @staticmethod
    def analyze_career_profile(profile: CareerProfile) -> CareerAnalysisData:
        target = profile.targetCareer or "Software Developer"
        exp = profile.experienceLevel or "Entry Level"
        skills = profile.skills if profile.skills else []
        interests = profile.interests if profile.interests else []

        edu_desc = ""
        if profile.education and (profile.education.degree or profile.education.branch):
            deg = profile.education.degree or "Degree"
            br = profile.education.branch or "Field"
            edu_desc = f" taking {deg} in {br}"

        loc_desc = f" based in {profile.personal.location}" if profile.personal and profile.personal.location else ""

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

    @classmethod
    def generate_skill_insights(cls, profile: CareerProfile, target_skills: Optional[List[str]] = None) -> SkillAnalysisData:
        target = profile.targetCareer or "Software Developer"
        current_skills = profile.skills if profile.skills else []

        # Find matching skill spec or fallback to default
        expected_skills = CAREER_SKILL_SPECS.get(target, DEFAULT_SKILL_SPEC)
        if target_skills:
            expected_skills = list(dict.fromkeys(expected_skills + target_skills))

        # Case-insensitive normalization maps
        user_norm_map: Set[str] = {cls._normalize_skill(s) for s in current_skills if s}

        matched_skills: List[str] = []
        developing_skills: List[str] = []
        missing_skills: List[str] = []

        for req in expected_skills:
            req_norm = cls._normalize_skill(req)
            # Direct or substring match check
            matched = False
            for u_skill in current_skills:
                u_norm = cls._normalize_skill(u_skill)
                if req_norm == u_norm or (len(u_norm) > 2 and u_norm in req_norm):
                    matched = True
                    break
            
            if matched:
                matched_skills.append(req)
            else:
                missing_skills.append(req)

        # Include user skills not explicitly in expected list as developing/current
        for u_skill in current_skills:
            if u_skill not in matched_skills:
                developing_skills.append(u_skill)

        # Build priority gaps list
        priority_gaps: List[SkillPriorityGap] = []
        for i, m_skill in enumerate(missing_skills[:5]):
            p_level = "HIGH" if i < 2 else "MEDIUM"
            priority_gaps.append(SkillPriorityGap(
                skill=m_skill,
                priority=p_level,
                reason=f"Commonly expected technical competency for entry-level {target} roles."
            ))

        # Confidence assessment
        if len(current_skills) >= 3 and profile.targetCareer:
            confidence = "HIGH"
        elif len(current_skills) >= 1 and profile.targetCareer:
            confidence = "MODERATE"
        else:
            confidence = "LOW"

        summary_msg = (
            f"Candidate matches {len(matched_skills)} of {len(expected_skills)} core skills for {target}. "
            f"Identified {len(missing_skills)} primary skill gap areas."
        )

        return SkillAnalysisData(
            status="fallback",
            target_career=target,
            required_skills=expected_skills,
            matched_skills=matched_skills,
            developing_skills=developing_skills,
            missing_skills=missing_skills,
            priority_gaps=priority_gaps,
            skill_gap_summary=summary_msg,
            confidence_level=confidence
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
