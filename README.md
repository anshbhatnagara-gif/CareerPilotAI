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
├── auth-success.html    # Phase 1: Authentication success page & onboarding entry
├── onboarding.html      # Phase 2: 6-Step Onboarding & Career Profile creation page
├── style.css            # Dark horror design system & responsive styling across all phases
├── auth.js              # Phase 1: Authentication service & localStorage session engine
├── onboarding.js        # Phase 2: Onboarding workflow, step validation & profile persistence
└── README.md            # Comprehensive project documentation
```

---

## 🚀 Architecture & Phases Overview

### Phase 1: Authentication Engine & Horror UI
- **User Registration & Login**: Full Name, Email Address, Password, Confirm Password validation.
- **Session Management**: Prototype browser `localStorage` persistence under `careerPilotUser` and `careerPilotLoggedIn`.
- **Route Guards**: Protects `auth-success.html` and `onboarding.html` against unauthenticated access. Redirects authenticated users away from `login.html` and `register.html`.
- **Visual Design**: Deep dark palette (`#050505` bg, `#0c0c0c` card surface, `#303030` border, `#b91c1c`/`#dc2626` crimson accents, cinematic ruined landscape background).

---

### Phase 2: Onboarding & Career Profile

Phase 2 enables authenticated users to complete a structured 6-step career profile builder.

#### 6-Step Workflow:

1. **Step 1 — About You**:
   - Full Name (pre-filled from `careerPilotUser.fullName`).
   - Email Address (pre-filled from `careerPilotUser.email`, read-only).
   - Location (required text input).

2. **Step 2 — Education**:
   - College / University (required text input).
   - Degree / Program (select: B.Tech, B.E., BCA, B.Sc, BBA, B.Com, MCA, M.Tech, Diploma, Other).
   - Branch / Specialization (required text input).
   - Current Year (select: 1st Year, 2nd Year, 3rd Year, 4th Year, Final Year, Other).
   - Expected Graduation Year (select: 2024–2030).

3. **Step 3 — Skills**:
   - Categorized multi-select checkboxes for Programming (C, C++, Java, Python, JS), Web Development (HTML, CSS, React, Node.js), Database (MySQL, MongoDB, PostgreSQL), and Tools (Git, GitHub, VS Code).
   - Interactive Custom Skill Input (`[ + ADD ]` tag with removal button `×`).
   - Requires at least 1 skill selected (`"Please select at least one skill."`).

4. **Step 4 — Interests**:
   - Multi-select areas of interest (Software Dev, Web Dev, App Dev, AI/ML, Data Science, Cybersecurity, Cloud, DevOps, UI/UX, Other).
   - Custom text field when "Other" is selected.
   - Requires at least 1 interest selected (`"Please select at least one area of interest."`).

5. **Step 5 — Career Goal**:
   - Target Career dropdown (Software Engineer, Frontend Developer, Backend Developer, Full Stack Developer, Python Developer, Data Analyst, Data Scientist, AI/ML Engineer, Cybersecurity Engineer, Cloud Engineer, DevOps Engineer, UI/UX Designer, Other).
   - Experience Level radio card selection (Beginner, Intermediate, Advanced).
   - Career Goal statement textarea.

6. **Step 6 — Review Profile**:
   - Complete structured summary of Personal, Education, Skills, Interests, and Career Goal.
   - Buttons: `[ EDIT ]` (returns to previous steps without data loss) and `[ SAVE PROFILE ]`.

---

## 💾 LocalStorage Data Schema

Career Profiles are stored separately from user authentication credentials under the key `careerPilotProfile`.

```json
{
  "personal": {
    "fullName": "Ansh Bhatnagar",
    "email": "ansh@gmail.com",
    "location": "Kota, Rajasthan"
  },
  "education": {
    "college": "IIT Bombay",
    "degree": "B.Tech",
    "branch": "Computer Science & Engineering",
    "currentYear": "3rd Year",
    "graduationYear": "2026"
  },
  "skills": ["Python", "JavaScript", "HTML", "CSS", "Git", "GitHub", "Docker"],
  "interests": ["Software Development", "AI / Machine Learning"],
  "careerGoal": {
    "targetCareer": "Software Engineer",
    "experienceLevel": "Beginner",
    "goal": "I want to become a software engineer and get a job in a product-based company."
  },
  "completed": true
}
```

> [!IMPORTANT]
> **Security Note**: User passwords are **NEVER** stored inside `careerPilotProfile`. Authentication credentials and profile information remain decoupled. `localStorage` is used as a frontend prototype persistence mechanism and will be replaced with a secure backend API in production.

---

## 🔮 Phase 3 Transition Notice

Upon successfully saving the profile:
- Displays message: `"Your career profile has been saved successfully."`
- Clicking `[ CONTINUE ]` presents notice: `"AI Career Assessment will be available in Phase 3."` (Phase 3 AI features are not implemented yet).
