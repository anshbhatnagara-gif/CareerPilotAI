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
├── style.css            # Dark horror design system & responsive styling across all phases
├── auth.js              # Phase 1: Authentication service & localStorage session engine
├── onboarding.js        # Phase 2: Onboarding workflow, step validation & profile persistence
├── assessment.js        # Phase 3: Profile analysis & assessment engine
├── readiness.js         # Phase 4: Career Readiness calculation & Skill Gap engine
├── roadmap.js           # Phase 5: Personalized Learning Roadmap generator engine
├── projects.js          # Phase 6: Projects recommendation & Project Tracker engine
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

#### Features & Engine (`projects.js`):
- **Route Protection**: Verifies `careerPilotLoggedIn === "true"`, `careerPilotProfile.completed === true`, `careerPilotReadiness`, `careerPilotRoadmap`, and a valid `targetCareer`.
- **Deterministic Career Catalogs (12 Roles)**:
  - Curated catalogs containing 6–10 practical projects spanning `BEGINNER`, `INTERMEDIATE`, and `ADVANCED` difficulty.
- **Project Personalization & Relevance**:
  - Compares project covered skills against missing readiness skills and upcoming roadmap items.
  - Dynamically calculates project priority (`HIGH`, `MEDIUM`, `LOW`) and generates tailored `"Why this project?"` rationales.
- **Interactive Project Tracker**:
  - State tracking: `NOT_STARTED` (default), `IN_PROGRESS`, `COMPLETED`.
  - Profile skills indicate capability but do **NOT** falsely mark projects completed.
  - Status changes update `careerPilotProjects` immediately in `localStorage` without altering readiness scores or profile skills.
- **Interactive Detail Modal View**:
  - Displays full objective, detailed description, why this project, skills covered, required prerequisites, tech stack, and step-by-step project milestones.
- **Real-Time Client-Side Filtering**:
  - Instant filtering by `ALL`, `HIGH PRIORITY`, `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `NOT STARTED`, `IN PROGRESS`, and `COMPLETED`.
- **Persistence & Triple Fingerprinting (`careerPilotProjects`)**:
  - Automatically regenerates recommendations when profile, readiness, or roadmap data changes, while preserving existing user project status where project IDs match.
  - Zero password storage.
- **Action Controls**:
  - `[ REVIEW PROFILE ]`: Returns to `onboarding.html`.
  - `[ BACK TO ROADMAP ]`: Returns to `roadmap.html`.
  - `[ CONTINUE ]`: Displays in-page locked notice for upcoming Phase 7 features.

---

## 💾 LocalStorage Data Schema (`careerPilotProjects`)

```json
{
  "targetCareer": "Frontend Developer",
  "readinessScore": 68,
  "projects": [
    {
      "id": "fe-proj-1",
      "title": "Responsive Developer Portfolio Website",
      "career": "Frontend Developer",
      "difficulty": "BEGINNER",
      "priority": "HIGH",
      "description": "A modern, accessible, mobile-first personal portfolio...",
      "objective": "Master semantic HTML5 markup, CSS3 Flexbox/Grid layouts...",
      "skillsCovered": ["HTML", "CSS", "Responsive Design"],
      "requiredSkills": ["HTML", "CSS"],
      "techStack": ["HTML5", "CSS3", "Responsive Design", "Flexbox/Grid"],
      "estimatedEffort": "3–5 hours",
      "whyThisProject": "This project is recommended because it strengthens Responsive Design...",
      "milestones": [
        "Draft wireframe and semantic HTML5 document structure",
        "Apply modern CSS styling, custom color variables, and typography",
        "Implement responsive navigation and media queries for mobile/tablet",
        "Deploy to GitHub Pages with clean cross-browser compatibility"
      ],
      "order": 1,
      "status": "NOT_STARTED"
    }
  ],
  "totalProjects": 8,
  "completedProjects": 0,
  "inProgressProjects": 0,
  "notStartedProjects": 8,
  "highPriorityProjects": 5,
  "generatedAt": "2026-09-15T01:50:00.000Z",
  "profileFingerprint": "fp_profile_12345",
  "readinessFingerprint": "fp_readiness_67890",
  "roadmapFingerprint": "fp_roadmap_11223"
}
```

> [!IMPORTANT]
> **Phase 7 Boundary**: Phase 6 does **NOT** implement interview simulations, resume builders, GitHub analyzers, or job matching engines. Those belong strictly to Phase 7+.
