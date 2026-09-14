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
├── style.css            # Dark horror design system & responsive styling across all phases
├── auth.js              # Phase 1: Authentication service & localStorage session engine
├── onboarding.js        # Phase 2: Onboarding workflow, step validation & profile persistence
├── assessment.js        # Phase 3: Profile analysis & assessment engine
├── readiness.js         # Phase 4: Career Readiness calculation & Skill Gap engine
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

#### Features & Analysis Engine (`readiness.js`):
- **Route Protection**: Verifies `careerPilotLoggedIn === "true"`, `careerPilotProfile.completed === true`, and a valid `targetCareer`.
- **Simulated Calculation Loading State**: Animated 5-step checklist (`✓ Profile loaded`, `✓ Career requirements loaded`, `✓ Current skills checked`, `✓ Skill gaps calculated`, `✓ Readiness analyzed`).
- **Deterministic Career Requirement Engine**:
  - Maps 12 career domains (Software Engineer, Frontend Developer, Backend Developer, Full Stack Developer, Python Developer, Data Analyst, Data Scientist, AI/ML Engineer, Cybersecurity Engineer, Cloud Engineer, DevOps Engineer, UI/UX Designer) to required domain skills and priority levels.
- **Weighted Readiness Calculation**:
  - Priority weights: `HIGH` = 3, `MEDIUM` = 2, `LOW` = 1.
  - Formula: `(Met Weights / Total Required Weights) * 100`.
  - Score Status Interpretation:
    - 90–100: `JOB-READY FOUNDATION`
    - 75–89: `STRONG FOUNDATION`
    - 50–74: `DEVELOPING`
    - 25–49: `EARLY STAGE`
    - 0–24: `STARTING POINT`
- **Skill Gap Analysis**:
  - Categorizes required skills into MET vs. MISSING.
  - Assigns deterministic `HIGH`, `MEDIUM`, or `LOW` priority to every missing skill gap alongside rationale ("Why it matters").
  - Identifies top `YOUR FIRST FOCUS` recommendations.
- **Persistence & Profile Fingerprinting (`careerPilotReadiness`)**:
  - Saves readiness results under `careerPilotReadiness` in `localStorage` with timestamp and profile fingerprint.
  - Automatically regenerates readiness if profile inputs change in onboarding.
  - User password is **NEVER** stored in `careerPilotReadiness`.
- **Action Controls**:
  - `[ REVIEW PROFILE ]`: Returns to `onboarding.html` allowing profile editing.
  - `[ CONTINUE ]`: Displays in-page locked notice for upcoming Phase 5 features.

---

## 💾 LocalStorage Data Schema (`careerPilotReadiness`)

```json
{
  "targetCareer": "Software Engineer",
  "score": 68,
  "status": "DEVELOPING",
  "requiredSkills": ["Programming", "Data Structures & Algorithms", "Problem Solving", "Git", "GitHub", "Backend Fundamentals", "APIs", "Database Fundamentals", "Projects"],
  "metSkills": ["Programming", "Git", "GitHub", "Backend Fundamentals", "APIs"],
  "missingSkills": ["Data Structures & Algorithms", "Problem Solving", "Database Fundamentals", "Projects"],
  "skillGaps": [
    {
      "skill": "Data Structures & Algorithms",
      "priority": "HIGH",
      "reason": "Essential for efficient problem solving, technical interviews, and scalable code."
    }
  ],
  "highPriorityCount": 2,
  "mediumPriorityCount": 0,
  "lowPriorityCount": 2,
  "coveredCount": 5,
  "requiredCount": 9,
  "alignment": "HIGH",
  "summary": "Your profile currently satisfies 5 of 9 core domain requirements for Software Engineer...",
  "advice": "As a Beginner aiming for a role as a Software Engineer...",
  "generatedAt": "2026-09-15T01:31:00.000Z",
  "profileFingerprint": "fp_readiness_12345"
}
```

> [!IMPORTANT]
> **Phase 5 Boundary**: Phase 4 does **NOT** implement the Personalized Learning Roadmap, weekly/monthly schedules, course recommendations, or project trackers. Those belong to Phase 5+.
