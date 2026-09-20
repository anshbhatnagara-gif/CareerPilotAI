from typing import Optional, List, Dict, Set
from app.schemas.analyze import (
    CareerProfile,
    CareerAnalysisData,
    SkillAnalysisData,
    LearningRecommendationData,
    SkillPriorityGap,
    LearningPriority,
    LearningStep
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

# Structured learning pathways for common career roles
CAREER_LEARNING_MAPS: Dict[str, List[Dict[str, Any]]] = {
    "AI/ML Engineer": [
        {"skill": "Python", "topics": ["Python Syntax & Functions", "Object-Oriented Python", "Virtual Environments"], "prerequisites": ["Programming Basics"], "practice": ["Build CLI data processing scripts"], "effort": "LOW"},
        {"skill": "Statistics & Probability", "topics": ["Probability Distributions", "Hypothesis Testing", "Linear Algebra"], "prerequisites": ["Basic Mathematics"], "practice": ["Solve statistical inference problems"], "effort": "MEDIUM"},
        {"skill": "Data Handling (Pandas/NumPy)", "topics": ["NumPy Arrays", "Pandas DataFrames", "Data Cleaning & Transformation"], "prerequisites": ["Python"], "practice": ["Clean and aggregate real-world CSV datasets"], "effort": "MEDIUM"},
        {"skill": "Machine Learning", "topics": ["Supervised Learning", "Unsupervised Learning", "Model Evaluation & Metrics"], "prerequisites": ["Python", "Statistics", "Data Handling"], "practice": ["Train scikit-learn models on Kaggle datasets"], "effort": "HIGH"},
        {"skill": "Deep Learning Frameworks", "topics": ["Neural Networks", "PyTorch / TensorFlow", "Model Deployment"], "prerequisites": ["Machine Learning"], "practice": ["Implement image classification neural net"], "effort": "HIGH"}
    ],
    "Frontend Developer": [
        {"skill": "HTML5 & CSS3", "topics": ["Semantic Markup", "Flexbox & Grid Layouts", "Responsive Design"], "prerequisites": ["None"], "practice": ["Build responsive landing pages"], "effort": "LOW"},
        {"skill": "JavaScript (ES6+)", "topics": ["ES6 Syntax", "DOM Manipulation", "Async/Promises", "Event Handling"], "prerequisites": ["HTML5 & CSS3"], "practice": ["Build interactive web utilities"], "effort": "MEDIUM"},
        {"skill": "REST API Consumption", "topics": ["Fetch API", "Async/Await", "JSON Parsing", "Error Handling"], "prerequisites": ["JavaScript (ES6+)"], "practice": ["Fetch and render data from public REST APIs"], "effort": "MEDIUM"},
        {"skill": "Frontend Framework (React)", "topics": ["React Components", "State & Props", "Hooks (useState, useEffect)", "Routing"], "prerequisites": ["JavaScript (ES6+)", "REST APIs"], "practice": ["Build a multi-page React single-page app"], "effort": "HIGH"}
    ],
    "Backend Developer": [
        {"skill": "Server-Side Programming", "topics": ["Node.js / Python Basics", "Event Loop & Async I/O", "Module System"], "prerequisites": ["Programming Fundamentals"], "practice": ["Build basic HTTP server scripts"], "effort": "LOW"},
        {"skill": "RESTful API Design", "topics": ["Route Handling", "HTTP Methods & Status Codes", "Middleware Pattern", "JSON Validation"], "prerequisites": ["Server-Side Programming"], "practice": ["Create REST API endpoints with Express / FastAPI"], "effort": "MEDIUM"},
        {"skill": "Database Management (SQL/NoSQL)", "topics": ["Relational Schemas", "SQL Queries & Joins", "Indexes & Transactions", "ORM Integration"], "prerequisites": ["Server-Side Programming"], "practice": ["Design database tables and execute complex JOIN queries"], "effort": "MEDIUM"},
        {"skill": "Authentication & Security", "topics": ["JWT Tokens", "Password Hashing (bcrypt)", "CORS & Header Security", "Input Sanitization"], "prerequisites": ["RESTful API Design", "Database Management"], "practice": ["Implement secure signup/login auth flow"], "effort": "HIGH"}
    ]
}


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

    @classmethod
    def generate_learning_recommendations(
        cls,
        profile: CareerProfile,
        focus_areas: Optional[List[str]] = None,
        missing_skills: Optional[List[str]] = None,
        developing_skills: Optional[List[str]] = None,
        priority_gaps: Optional[List[SkillPriorityGap]] = None
    ) -> LearningRecommendationData:
        target = profile.targetCareer or "Software Developer"
        current_skills = profile.skills if profile.skills else []

        # If skill gaps are not explicitly provided, compute them via fallback skill insights
        if missing_skills is None or developing_skills is None:
            insights = cls.generate_skill_insights(profile)
            if missing_skills is None:
                missing_skills = insights.missing_skills
            if developing_skills is None:
                developing_skills = insights.developing_skills
            if priority_gaps is None:
                priority_gaps = insights.priority_gaps

        user_skills_norm = {cls._normalize_skill(s) for s in current_skills if s}

        # Filter out mastered skills from missing_skills
        filtered_missing = []
        for ms in missing_skills:
            if cls._normalize_skill(ms) not in user_skills_norm:
                filtered_missing.append(ms)

        # Build learning priorities
        priorities: List[LearningPriority] = []
        for i, ms in enumerate(filtered_missing[:5]):
            p_val = "HIGH" if i < 2 else "MEDIUM"
            priorities.append(LearningPriority(
                skill=ms,
                priority=p_val,
                reason=f"Essential skill gap to address for entry-level {target} target role."
            ))

        for ds in developing_skills[:3]:
            if cls._normalize_skill(ds) not in {cls._normalize_skill(p.skill) for p in priorities}:
                priorities.append(LearningPriority(
                    skill=ds,
                    priority="MEDIUM",
                    reason=f"Strengthen developing competency in {ds} for {target} readiness."
                ))

        # Build learning sequence steps
        learning_sequence: List[LearningStep] = []
        rec_map = CAREER_LEARNING_MAPS.get(target)

        if rec_map:
            for idx, item in enumerate(rec_map):
                sk = item["skill"]
                # Skip if mastered
                if cls._normalize_skill(sk) in user_skills_norm:
                    continue
                learning_sequence.append(LearningStep(
                    order=len(learning_sequence) + 1,
                    skill=sk,
                    topics=item["topics"],
                    prerequisites=item["prerequisites"],
                    practice_focus=item["practice"],
                    estimated_effort=item["effort"]
                ))
        else:
            # Dynamic sequence from filtered_missing + developing_skills
            target_list = filtered_missing + [d for d in developing_skills if cls._normalize_skill(d) not in user_skills_norm]
            if not target_list:
                target_list = CAREER_SKILL_SPECS.get(target, DEFAULT_SKILL_SPEC)[:4]

            for idx, sk in enumerate(target_list[:5]):
                learning_sequence.append(LearningStep(
                    order=idx + 1,
                    skill=sk,
                    topics=[f"{sk} Core Concepts", f"{sk} Practical Patterns", f"{sk} Testing"],
                    prerequisites=["Programming Foundations"] if idx > 0 else ["None"],
                    practice_focus=[f"Implement mini-project utilizing {sk}"],
                    estimated_effort="MEDIUM" if idx < 3 else "HIGH"
                ))

        recommended_topics: List[str] = []
        practice_focus: List[str] = []

        for step in learning_sequence:
            recommended_topics.extend(step.topics)
            practice_focus.extend(step.practice_focus)

        if focus_areas:
            recommended_topics.extend(focus_areas)

        if len(current_skills) >= 2 and profile.targetCareer:
            confidence = "HIGH"
        elif profile.targetCareer:
            confidence = "MODERATE"
        else:
            confidence = "LOW"

        summary_text = (
            f"Structured {len(learning_sequence)}-step learning recommendation pathway "
            f"tailored for {target} preparation, addressing {len(filtered_missing)} missing skills."
        )

        return LearningRecommendationData(
            status="fallback",
            target_career=target,
            learning_priorities=priorities,
            learning_sequence=learning_sequence,
            recommended_topics=list(dict.fromkeys(recommended_topics)),
            practice_focus=list(dict.fromkeys(practice_focus)),
            learning_summary=summary_text,
            confidence_level=confidence
        )

