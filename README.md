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
├── style.css            # Dark horror design system & responsive styling across all phases
├── auth.js              # Phase 1: Authentication service & localStorage session engine
├── onboarding.js        # Phase 2: Onboarding workflow, step validation & profile persistence
├── assessment.js        # Phase 3: Profile analysis & assessment engine
├── readiness.js         # Phase 4: Career Readiness calculation & Skill Gap engine
├── roadmap.js           # Phase 5: Personalized Learning Roadmap generator engine
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

#### Features & Engine (`roadmap.js`):
- **Route Protection**: Verifies `careerPilotLoggedIn === "true"`, `careerPilotProfile.completed === true`, `careerPilotReadiness`, and a valid `targetCareer`.
- **5 Learning Stages**:
  1. `STAGE 1: FOUNDATION`: Essential baseline concepts and core tools.
  2. `STAGE 2: CORE SKILLS`: Core working knowledge and domain competence.
  3. `STAGE 3: DEVELOPMENT DEPTH`: Frameworks, architecture, and system integration.
  4. `STAGE 4: ADVANCED / SPECIALIZATION`: Advanced patterns, tools, and design concepts.
  5. `STAGE 5: JOB PREPARATION FOUNDATION`: Practical portfolio readiness and technical problem solving.
- **Prerequisite Graph Engine**:
  - Maps technical dependency relationships (e.g. `HTML` → `CSS` → `Responsive Design`, `JavaScript` → `React` / `APIs`, `Python` → `Pandas` → `Machine Learning`, `Linux` → `Containers` → `Deployment`, etc.).
- **Strict Skill Completion Mapping**:
  - Skills are marked `COMPLETED` if and only if present in normalized `profile.skills`.
  - Unacquired skills are strictly marked `UPCOMING`.
- **Deterministic Effort Estimation**:
  - Assigns structured effort ranges (`3–5 hours`, `6–10 hours`, `10–20 hours`, `20–30 hours`).
- **Milestones**:
  - Generates outcome-focused learning milestones for every stage.
- **Persistence & Double Fingerprinting (`careerPilotRoadmap`)**:
  - Stores roadmap data under `careerPilotRoadmap` in `localStorage`.
  - Uses both `profileFingerprint` and `readinessFingerprint` to automatically refresh the roadmap when profile skills or readiness gaps change.
  - Zero password storage.
- **Action Controls**:
  - `[ REVIEW PROFILE ]`: Returns to `onboarding.html`.
  - `[ BACK TO READINESS ]`: Returns to `readiness.html`.
  - `[ CONTINUE ]`: Displays in-page locked notice for upcoming Phase 6 features.

---

## 💾 LocalStorage Data Schema (`careerPilotRoadmap`)

```json
{
  "targetCareer": "Frontend Developer",
  "readinessScore": 68,
  "status": "DEVELOPING",
  "stages": [
    {
      "id": "stage-1",
      "title": "STAGE 1 — FOUNDATION",
      "description": "Establish essential baseline concepts...",
      "milestone": "Master core syntax and web styling fundamentals.",
      "items": [
        {
          "id": "item-1",
          "skill": "HTML",
          "stage": "stage-1",
          "priority": "HIGH",
          "status": "COMPLETED",
          "reason": "Semantic document markup foundation for web pages.",
          "prerequisites": [],
          "estimatedEffort": "3–5 hours",
          "order": 1
        }
      ]
    }
  ],
  "totalItems": 8,
  "completedItems": 3,
  "upcomingItems": 5,
  "highPriorityItems": 3,
  "estimatedTotalEffort": "45–70 hours",
  "generatedAt": "2026-09-15T01:36:00.000Z",
  "profileFingerprint": "fp_profile_12345",
  "readinessFingerprint": "fp_readiness_67890"
}
```

> [!IMPORTANT]
> **Phase 6 Boundary**: Phase 5 does **NOT** implement project recommendation engines, project trackers, interview simulators, resume builders, or job matching systems. Those belong strictly to Phase 6+.
