# CareerPilot AI — Phase 1: Authentication (Cinematic Dark Horror Theme)

CareerPilot AI is a career guidance platform for students and freshers. Phase 1 provides a complete authentication foundation featuring a **Dark Cinematic Horror Atmosphere** combined with modern, accessible, and responsive form controls.

---

## 📁 File Structure

```text
careerpilot-ai/
│
├── assets/
│   └── horror-bg.jpg    # High-resolution cinematic horror background landscape
├── login.html           # Login page with dramatic split-screen composition
├── register.html        # Registration page with split-screen composition
├── auth-success.html    # Success verification screen & route guard target
├── style.css            # Dark horror design system & responsive styling
├── auth.js              # Authentication service & localStorage logic
└── README.md            # Project documentation & design system reference
```

---

## 🎨 Visual Design Tokens & Palette

- **Primary Background**: `#050505`
- **Secondary Background**: `#0b0b0b`
- **Card Surface**: `#0c0c0c` / `rgba(12, 12, 12, 0.92)`
- **Input Fill**: `#121212`
- **Primary Text**: `#f5f5f5`
- **Secondary Text**: `#a3a3a3`
- **Border Color**: `#303030`
- **Horror Accent**: `#b91c1c`
- **Bright Highlight**: `#dc2626`
- **Success Accent**: Muted green (`#4ade80` / `rgba(20, 83, 45, 0.3)`)

---

## ✨ Features

1. **Cinematic Split-Screen Desktop Layout**:
   - Left column features dramatic uppercase horror titles (`WELCOME BACK`, `CREATE YOUR ACCOUNT`) with crimson red text highlights.
   - Right column presents a dark authentication card with thin borders and focus indicators.

2. **Full Responsive Mobile Support**:
   - Single-column stacked layout on viewports down to 360px without horizontal scroll.

3. **Complete Authentication Engine (`auth.js`)**:
   - LocalStorage keys: `careerPilotUser` and `careerPilotLoggedIn`.
   - Full input validation (name, email syntax, 8+ character password, password matching, duplicate email check).
   - Route protection for `auth-success.html` and automatic redirection for logged-in users visiting login/register.
