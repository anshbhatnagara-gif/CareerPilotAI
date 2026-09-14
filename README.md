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
├── style.css            # Dark horror design system & responsive styling across all phases
├── auth.js              # Phase 1: Authentication service & localStorage session engine
├── onboarding.js        # Phase 2: Onboarding workflow, step validation & profile persistence
├── assessment.js        # Phase 3: Deterministic local profile analysis & assessment engine
└── README.md            # Comprehensive project documentation
```

---

## 🚀 Architecture & Phases Overview

### Phase 1: Authentication Engine & Horror UI
- **User Registration & Login**: Full Name, Email Address, Password, Confirm Password validation.
- **Session Management**: Prototype browser `localStorage` persistence under `careerPilotUser` and `careerPilotLoggedIn`.
- **Route Guards**: Protects `auth-success.html`, `onboarding.html`, and `assessment.html` against unauthenticated access.
- **Visual Design**: Deep dark palette (`#050505` bg, `#0c0c0c` card surface, `#303030` border, `#b91c1c`/`#dc2626` crimson accents, cinematic ruined landscape background).

---

### Phase 2: Onboarding & Career Profile
Phase 2 enables authenticated users to complete a structured 6-step career profile builder stored in `localStorage` under `careerPilotProfile`.
- **6-Step Workflow**: About You, Education, Skills (categorized checkboxes + custom tags), Interests, Career Goal (Target career, experience level, goal statement), and Summary Review.

---

### Phase 3: AI Career Assessment
Phase 3 performs a profile-based analysis of the user's completed `careerPilotProfile`.

#### Features & Analysis Engine (`assessment.js`):
- **Dual Route Protection**: Verifies `careerPilotLoggedIn === "true"` AND `careerPilotProfile.completed === true`. Redirects unauthenticated users to `login.html` and un-onboarded users to `onboarding.html`.
- **Simulated Analysis Loading State**: Animated 4-step checklist (`✓ Education analyzed`, `✓ Skills analyzed`, `✓ Interests analyzed`, `✓ Career goal analyzed`).
- **Deterministic Assessment Engine**:
  - **Career Direction & Alignment**: Evaluates profile inputs against target career domain requirements and generates qualitative alignment status (`HIGH`, `MODERATE`, `LOW`).
  - **Profile Summary**: Dynamic narrative paragraph synthesized from education, skills, interests, and target career.
  - **Your Strengths**: Dynamic strength badges derived from actual selected skills and background.
  - **Current Skills**: Matches `profile.skills` exactly (no fake skills).
  - **Recommended Focus Areas**: Targeted domain learning recommendations compared against career requirements.
  - **Career Advice**: Actionable guidance tailored to experience level (Beginner, Intermediate, Advanced).
- **Profile Fingerprinting & Persistence**:
  - Stores assessment under `careerPilotAssessment` in `localStorage` with ISO timestamp.
  - Computes a profile fingerprint to detect changes: if profile details change, the assessment is automatically regenerated.
  - User password is **NEVER** stored inside `careerPilotAssessment`.
- **Action Controls**:
  - `[ REVIEW PROFILE ]`: Returns to `onboarding.html` allowing re-editing.
  - `[ CONTINUE ]`: Displays in-page locked notice for upcoming Phase 4 features.

---

## 💾 LocalStorage Data Schemas

### `careerPilotProfile`
```json
{
  "personal": { "fullName": "Ansh Bhatnagar", "email": "ansh@gmail.com", "location": "Kota, Rajasthan" },
  "education": { "college": "IIT Bombay", "degree": "B.Tech", "branch": "Computer Science & Engineering", "currentYear": "3rd Year", "graduationYear": "2026" },
  "skills": ["Python", "JavaScript", "HTML", "CSS", "Git", "GitHub"],
  "interests": ["Software Development", "AI / Machine Learning"],
  "careerGoal": { "targetCareer": "Software Engineer", "experienceLevel": "Beginner", "goal": "Build software products." },
  "completed": true
}
```

### `careerPilotAssessment`
```json
{
  "careerDirection": "Your current profile demonstrates a HIGH alignment with your selected target career of Software Engineer.",
  "profileSummary": "Based on your profile, pursuing a B.Tech background...",
  "strengths": ["Programming Foundation", "Version Control & Tooling Awareness", "Web Development Exposure"],
  "currentSkills": ["Python", "JavaScript", "HTML", "CSS", "Git", "GitHub"],
  "focusAreas": ["Data Structures & Algorithms", "Backend Fundamentals", "Problem Solving"],
  "careerAdvice": "As a Beginner aiming for a role as a Software Engineer...",
  "confidenceLevel": "HIGH",
  "generatedAt": "2026-09-15T01:26:00.000Z",
  "profileFingerprint": "fp_12345678"
}
```

> [!IMPORTANT]
> **Phase 4 Boundary**: Phase 3 does **NOT** implement the official numeric Career Readiness Score or Skill Gap engine. Those features belong to Phase 4.
