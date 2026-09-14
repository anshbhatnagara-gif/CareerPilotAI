# CareerPilot AI — Career Intelligence & Guidance Platform

CareerPilot AI is a comprehensive career guidance platform for students and freshers. The platform features a **Dark Cinematic Horror Atmosphere** combined with modern, accessible, and responsive user experience controls.

---

## 📁 File Structure

```text
careerpilot-ai/
│
├── assets/
│   └── horror-bg.jpg    # High-resolution cinematic horror background landscape
├── login.html           # Phase 1: User login page
├── register.html        # Phase 1: Registration page
├── auth-success.html    # Phase 1: Authentication success page
├── onboarding.html      # Phase 2: 6-Step Onboarding & Career Profile creation page
├── assessment.html      # Phase 3: AI Career Assessment page
├── readiness.html       # Phase 4: Career Readiness & Skill Gap Analysis page
├── roadmap.html         # Phase 5: Personalized Learning Roadmap page
├── projects.html        # Phase 6: Projects & Project Tracker page
├── interview.html       # Phase 7: Interview Simulator, Resume Tools & Evidence Tracker page
├── style.css            # Dark horror design system & responsive styling across all phases
├── auth.js              # Phase 1: Authentication service & localStorage session engine
├── onboarding.js        # Phase 2: Onboarding workflow, step validation & profile persistence
├── assessment.js        # Phase 3: Profile analysis & assessment engine
├── readiness.js         # Phase 4: Career Readiness calculation & Skill Gap engine
├── roadmap.js           # Phase 5: Personalized Learning Roadmap generator engine
├── projects.js          # Phase 6: Projects recommendation & Project Tracker engine
├── interview.js         # Phase 7: Interview simulator, resume builder & evidence engine
└── README.md            # Comprehensive project documentation
```

---

## 🚀 Architecture & Phases Overview

### Phase 1: Authentication Engine & Horror UI
- **User Registration & Login**: Full Name, Email Address, Password, Confirm Password validation.
- **Session Management**: Prototype browser `localStorage` persistence under `careerPilotUser` and `careerPilotLoggedIn`.
- **Route Guards**: Protects all authenticated pages against unauthenticated access.
- **Visual Design**: Deep dark palette (`#050505` bg, `#0c0c0c` card surface, `#303030` border, `#b91c1c`/`#dc2626` crimson accents, cinematic ruined landscape background).

---

### Phase 2: Onboarding & Career Profile
Phase 2 enables authenticated users to complete a structured 6-step career profile builder stored in `localStorage` under `careerPilotProfile`.
- **6-Step Workflow**: About You, Education, Skills (categorized checkboxes + custom tags), Interests, Career Goal, and Summary Review.

---

### Phase 3: AI Career Assessment
Phase 3 performs a qualitative profile-based analysis of the user's completed `careerPilotProfile`.
- **Features**: Career Direction, qualitative alignment (`HIGH`, `MODERATE`, `LOW`), dynamic profile summary, strengths analysis, current skills display, recommended focus areas, and career advice.

---

### Phase 4: Career Readiness & Skill Gap Engine
Phase 4 calculates a quantitative, weighted **Career Readiness Score (0–100)** and generates an official **Skill Gap Analysis**.
- **Features & Analysis Engine (`readiness.js`)**:
  - Deterministic Career Requirement Engine across 12 tech career domains.
  - Weighted readiness score calculation (`HIGH` = 3, `MEDIUM` = 2, `LOW` = 1).
  - Skill Gap Analysis (categorized into MET vs MISSING with priority levels and rationales).
  - Persistence & Profile Fingerprinting (`careerPilotReadiness`).

---

### Phase 5: Personalized Learning Roadmap Engine
Phase 5 converts the Phase 4 Readiness Score and Skill Gap output into a structured, deterministic **Personalized Learning Roadmap**.
- **Features & Engine (`roadmap.js`)**:
  - 5 Learning Stages: Foundation, Core Skills, Development Depth, Advanced/Specialization, Job Prep Foundation.
  - Prerequisite dependency graph mapping and conservative skill completion verification.
  - Double fingerprinting persistence (`careerPilotRoadmap`).

---

### Phase 6: Projects & Project Tracker Engine
Phase 6 converts the user's readiness gaps and roadmap sequences into personalized, portfolio-ready project recommendations and provides an interactive project tracker.
- **Features & Engine (`projects.js`)**:
  - Curated project catalogs for 12 career roles (Beginner, Intermediate, Advanced).
  - Dynamic prioritization matching missing roadmap skills.
  - State tracking: `NOT_STARTED` (default), `IN_PROGRESS`, `COMPLETED`.
  - Triple fingerprinting persistence (`careerPilotProjects`).

---

### Phase 7: Interview Simulator, Resume Tools & Evidence Tracker Engine
Phase 7 provides technical interview practice, automated resume profile exports, and verified portfolio evidence tracking.

#### Features & Engine (`interview.js`):
- **1. 🎤 Interview Simulator**:
  - 5 career-tailored technical & scenario questions per role for all 12 domains.
  - Interactive answer input supporting STAR method response formatting.
  - Deterministic multi-dimensional evaluation:
    - **Technical Depth Score (0–100)**: Domain keyword vector matching and technical terminology precision.
    - **Communication Score (0–100)**: Response length, multi-sentence structuring, paragraph readability, and clarity.
    - **Problem-Solving Score (0–100)**: Trade-off reasoning, computational complexity, and edge-case handling.
  - Generates constructive feedback, identified strengths, and specific areas to strengthen.
- **2. 📄 Resume & Career Readiness Tools**:
  - 4-Tier Career Readiness Audit Checklist (Profile Completeness, Skill Coverage, Project Proof, Interview Score).
  - Formatted ATS-Friendly Resume Preview generator with Markdown export and print formatting.
- **3. 🐙 GitHub & Portfolio Evidence**:
  - Evidence Tracker linking Phase 6 projects to GitHub repository URLs and live deployment links.
  - Verified Career Passport summary modal documenting complete candidate readiness.
- **Persistence (`careerPilotInterview` & `careerPilotCareerTools`)**:
  - Client-side `localStorage` persistence with zero passwords or credentials.

---

## 💾 LocalStorage Data Schemas

### `careerPilotInterview`
```json
{
  "targetCareer": "Frontend Developer",
  "overallScore": 82,
  "completedAnswers": {
    "fe-q1": {
      "userAnswer": "In a high-throughput scenario...",
      "evaluation": {
        "technicalScore": 85,
        "communicationScore": 80,
        "problemSolvingScore": 82,
        "overallScore": 83,
        "statusLabel": "STRONG RESPONSE",
        "feedback": "Excellent response...",
        "strengths": ["Strong domain terminology & keyword precision"],
        "weaknesses": ["Further quantify real-world benchmark metrics"]
      },
      "evaluatedAt": "2026-09-15T01:55:00.000Z"
    }
  }
}
```

### `careerPilotCareerTools`
```json
{
  "projectEvidence": {
    "fe-proj-1": {
      "githubUrl": "https://github.com/alex/portfolio",
      "liveUrl": "https://alex-portfolio.dev"
    }
  }
}
```
