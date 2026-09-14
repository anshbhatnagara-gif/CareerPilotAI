/**
 * CAREERPILOT AI - PHASE 7 INTERVIEW SIMULATOR & CAREER TOOLS ENGINE
 * 
 * Local deterministic interview simulator, resume builder, and portfolio evidence engine.
 * 
 * Features:
 * - 5 Career-tailored technical & scenario interview questions per role across 12 domains
 * - Deterministic multi-dimensional evaluation: Technical Depth, Communication Clarity, Problem Solving
 * - Dynamic feedback, strengths analysis, and weak areas identification
 * - ATS-friendly Markdown Resume generator & print preview
 * - 4-Tier Career Readiness Audit Checklist
 * - GitHub & Live Demo Evidence Tracker with LocalStorage persistence
 * - Verified Career Passport modal export
 * - Zero external AI dependencies & zero password storage
 */

const PROFILE_STORAGE_KEY = 'careerPilotProfile';
const ASSESSMENT_STORAGE_KEY = 'careerPilotAssessment';
const READINESS_STORAGE_KEY = 'careerPilotReadiness';
const ROADMAP_STORAGE_KEY = 'careerPilotRoadmap';
const PROJECTS_STORAGE_KEY = 'careerPilotProjects';
const INTERVIEW_STORAGE_KEY = 'careerPilotInterview';
const CAREER_TOOLS_STORAGE_KEY = 'careerPilotCareerTools';

const InterviewApp = {
  profile: null,
  assessment: null,
  readiness: null,
  roadmap: null,
  projects: null,
  interviewData: null,
  careerToolsData: null,
  currentQuestionIndex: 0,
  activeTab: 'interview-tab',

  init() {
    if (!this.protectRoute()) return;
    this.bindEvents();
    this.loadData();
    this.renderAll();
  },

  /**
   * Route Guard: Requires auth, profile, readiness, roadmap, and projects
   */
  protectRoute() {
    // 1. Session check
    if (typeof AuthService !== 'undefined') {
      if (!AuthService.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
      }
    } else {
      if (localStorage.getItem('careerPilotLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return false;
      }
    }

    // 2. Profile check
    try {
      const profileRaw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!profileRaw) {
        window.location.href = 'onboarding.html';
        return false;
      }
      this.profile = JSON.parse(profileRaw);
      if (!this.profile || this.profile.completed !== true) {
        window.location.href = 'onboarding.html';
        return false;
      }
      if (!this.profile.careerGoal || !this.profile.careerGoal.targetCareer) {
        window.location.href = 'assessment.html';
        return false;
      }
    } catch (e) {
      console.error('Error reading profile:', e);
      window.location.href = 'onboarding.html';
      return false;
    }

    // 3. Readiness check
    try {
      const readinessRaw = localStorage.getItem(READINESS_STORAGE_KEY);
      if (!readinessRaw) {
        window.location.href = 'readiness.html';
        return false;
      }
      this.readiness = JSON.parse(readinessRaw);
      if (!this.readiness || !this.readiness.targetCareer) {
        window.location.href = 'readiness.html';
        return false;
      }
    } catch (e) {
      console.error('Error reading readiness:', e);
      window.location.href = 'readiness.html';
      return false;
    }

    // 4. Roadmap check
    try {
      const roadmapRaw = localStorage.getItem(ROADMAP_STORAGE_KEY);
      if (!roadmapRaw) {
        window.location.href = 'roadmap.html';
        return false;
      }
      this.roadmap = JSON.parse(roadmapRaw);
    } catch (e) {
      console.error('Error reading roadmap:', e);
      window.location.href = 'roadmap.html';
      return false;
    }

    // 5. Projects check
    try {
      const projectsRaw = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (!projectsRaw) {
        window.location.href = 'projects.html';
        return false;
      }
      this.projects = JSON.parse(projectsRaw);
    } catch (e) {
      console.error('Error reading projects:', e);
      window.location.href = 'projects.html';
      return false;
    }

    return true;
  },

  /**
   * Event Bindings
   */
  bindEvents() {
    // Header user name
    if (this.profile && this.profile.personal && this.profile.personal.fullName) {
      const badgeName = document.getElementById('header-user-name');
      if (badgeName) badgeName.textContent = this.profile.personal.fullName;
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (typeof AuthService !== 'undefined') {
          AuthService.logout();
        } else {
          localStorage.removeItem('careerPilotLoggedIn');
          window.location.href = 'login.html';
        }
      });
    }

    // Navigation buttons
    const reviewBtn = document.getElementById('review-profile-btn');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => {
        window.location.href = 'onboarding.html';
      });
    }

    const backProjectsBtn = document.getElementById('back-projects-btn');
    if (backProjectsBtn) {
      backProjectsBtn.addEventListener('click', () => {
        window.location.href = 'projects.html';
      });
    }

    // Tool Tabs Switching
    const tabBtns = document.querySelectorAll('.tool-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetTabId = btn.dataset.tab;
        document.querySelectorAll('.tab-content-panel').forEach(panel => {
          panel.style.display = panel.id === targetTabId ? 'block' : 'none';
        });
        this.activeTab = targetTabId;
      });
    });

    // Textarea character count
    const answerInput = document.getElementById('user-answer-input');
    const charCount = document.getElementById('answer-char-count');
    if (answerInput && charCount) {
      answerInput.addEventListener('input', () => {
        charCount.textContent = answerInput.value.length + " characters";
      });
    }

    // Insert Sample Response button
    const sampleBtn = document.getElementById('btn-quick-sample');
    if (sampleBtn && answerInput) {
      sampleBtn.addEventListener('click', () => {
        const q = this.getCurrentQuestion();
        if (q && q.sampleAnswer) {
          answerInput.value = q.sampleAnswer;
          if (charCount) charCount.textContent = answerInput.value.length + " characters";
        }
      });
    }

    // Evaluate Answer Button
    const evalBtn = document.getElementById('btn-evaluate-answer');
    if (evalBtn) {
      evalBtn.addEventListener('click', () => {
        this.evaluateCurrentAnswer();
      });
    }

    // Next Question Button
    const nextQBtn = document.getElementById('btn-next-question');
    if (nextQBtn) {
      nextQBtn.addEventListener('click', () => {
        const questions = this.getCareerQuestions();
        if (this.currentQuestionIndex < questions.length - 1) {
          this.currentQuestionIndex++;
          this.renderQuestionView();
        } else {
          this.currentQuestionIndex = 0;
          this.renderQuestionView();
        }
      });
    }

    // Copy Resume Button
    const copyResumeBtn = document.getElementById('btn-copy-resume');
    if (copyResumeBtn) {
      copyResumeBtn.addEventListener('click', () => {
        const resumeText = this.generateMarkdownResume();
        navigator.clipboard.writeText(resumeText).then(() => {
          copyResumeBtn.textContent = 'COPIED TO CLIPBOARD ✓';
          setTimeout(() => { copyResumeBtn.textContent = 'COPY MARKDOWN'; }, 2000);
        });
      });
    }

    // Print Resume Button
    const printResumeBtn = document.getElementById('btn-print-resume');
    if (printResumeBtn) {
      printResumeBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Save Evidence Button
    const saveEvidenceBtn = document.getElementById('btn-save-evidence');
    if (saveEvidenceBtn) {
      saveEvidenceBtn.addEventListener('click', () => {
        this.saveEvidenceFromInputs();
      });
    }

    // Career Passport Modal Controls
    const viewPassportBtn = document.getElementById('view-passport-btn');
    const passportModal = document.getElementById('passport-modal-backdrop');
    const passportCloseBtn = document.getElementById('passport-close-btn');
    const passCloseModalBtn = document.getElementById('pass-close-modal-btn');

    if (viewPassportBtn && passportModal) {
      viewPassportBtn.addEventListener('click', () => {
        this.populatePassportModal();
        passportModal.style.display = 'flex';
      });
    }

    if (passportCloseBtn && passportModal) {
      passportCloseBtn.addEventListener('click', () => {
        passportModal.style.display = 'none';
      });
    }

    if (passCloseModalBtn && passportModal) {
      passCloseModalBtn.addEventListener('click', () => {
        passportModal.style.display = 'none';
      });
    }

    if (passportModal) {
      passportModal.addEventListener('click', (e) => {
        if (e.target === passportModal) passportModal.style.display = 'none';
      });
    }
  },

  /**
   * Question Catalog for 12 Tech Roles
   */
  getCareerQuestions() {
    const target = this.readiness.targetCareer || (this.profile.careerGoal ? this.profile.careerGoal.targetCareer : "Software Engineer");
    
    const catalogs = {
      "Software Engineer": [
        {
          id: "se-q1",
          title: "Algorithmic Optimization & Time Complexity Analysis",
          difficulty: "INTERMEDIATE",
          category: "DATA STRUCTURES & ALGORITHMS",
          scenario: "You are designing an in-memory lookup cache processing millions of incoming transaction events. How would you choose and structure your data types to ensure O(1) average lookup and insertion time while handling hash collisions?",
          hint: "State the data structure chosen, explain how buckets/chaining work, address worst-case O(N) edge cases, and analyze memory trade-offs.",
          keywords: ["hash map", "hash table", "collision", "time complexity", "o(1)", "memory", "tradeoff", "buckets", "chaining", "constant time"],
          tradeoffConcepts: ["space complexity vs lookup latency", "open addressing vs separate chaining", "resizing load factor overhead"],
          idealApproach: "Recommend a hash map with dynamic load factor resizing. Discuss collision resolution strategies, amortized O(1) performance, and space-time trade-offs.",
          sampleAnswer: "In a high-throughput transaction lookup scenario, I would implement a hash map utilizing separate chaining or open addressing with an optimized load factor (typically 0.75). The keys would be hashed using a uniform hashing function ensuring O(1) average-time lookups and inserts. To handle potential hash collisions and mitigate worst-case O(N) degradation, collision buckets can transition to self-balancing binary search trees (like Red-Black trees in Java HashMap) achieving O(log N) worst-case. The primary trade-off is higher memory allocation for bucket arrays versus ultra-low latency execution."
        },
        {
          id: "se-q2",
          title: "Modular RESTful API & Error Handling Architecture",
          difficulty: "INTERMEDIATE",
          category: "SYSTEM DESIGN & APIS",
          scenario: "Describe how you would design a clean, maintainable REST API endpoint for user registration and authentication, including input validation, rate limiting, and centralized error logging.",
          hint: "Detail HTTP methods, status codes (201, 400, 429, 500), middleware architecture, and security practices like password hashing.",
          keywords: ["rest", "api", "post", "status code", "validation", "middleware", "jwt", "bcrypt", "error handling", "rate limiting", "hashing"],
          tradeoffConcepts: ["stateless tokens vs server sessions", "synchronous validation overhead", "security vs throughput"],
          idealApproach: "Structure endpoint with route controllers, request validation middleware, salted password hashing, JWT generation, and centralized error middleware.",
          sampleAnswer: "I would structure the registration route using a POST /api/v1/auth/register endpoint. The request body is first sanitized and validated against a schema validator middleware before reaching the controller. For security, passwords are salted and hashed using Bcrypt before saving to the database. Upon success, the server responds with HTTP 201 Created and an encrypted JWT token. I implement rate limiting middleware (e.g. max 5 attempts per minute) to defend against brute-force attacks, and encapsulate error handling in a centralized middleware catching exceptions and logging with correlation IDs."
        },
        {
          id: "se-q3",
          title: "Database Indexing & Query Performance Tuning",
          difficulty: "ADVANCED",
          category: "DATABASES",
          scenario: "A critical database query joining orders and customer profiles is causing high latency during peak traffic. How do you diagnose the bottleneck and implement indexing or schema optimizations?",
          hint: "Explain EXPLAIN ANALYZE, B-Tree indexes, composite indexing, and normalization vs denormalization trade-offs.",
          keywords: ["explain analyze", "index", "b-tree", "composite index", "query optimization", "join", "latency", "bottleneck", "foreign key"],
          tradeoffConcepts: ["write penalty of multiple indexes vs read speed", "denormalization caching vs storage"],
          idealApproach: "Use query execution profiling tools (EXPLAIN ANALYZE), identify full table scans, create targeted composite B-Tree indexes on foreign keys, and optimize join conditions.",
          sampleAnswer: "I would first profile the slow query using EXPLAIN ANALYZE to identify whether a full table scan or sequential scan is occurring. If the join on customer_id lacks an index, I would create a composite B-Tree index covering the join keys and filtered columns. Furthermore, I would evaluate index maintenance trade-offs: while read latency decreases drastically from O(N) to O(log N), write operations incur slight overhead to update the index tree. If traffic remains intensive, read replicas or caching frequently accessed profile records in Redis would be utilized."
        },
        {
          id: "se-q4",
          title: "Software Design Patterns & Clean Code Decoupling",
          difficulty: "INTERMEDIATE",
          category: "OBJECT-ORIENTED DESIGN",
          scenario: "Explain how you would apply the Factory pattern or Dependency Injection to decouple your payment processing service from specific payment gateways (Stripe, PayPal, Mock Gateway).",
          hint: "Discuss interface abstractions, dependency injection, testability, and Open-Closed Principle (SOLID).",
          keywords: ["factory pattern", "dependency injection", "interface", "solid", "decoupling", "unit test", "polymorphism", "abstraction"],
          tradeoffConcepts: ["interface boilerplate vs flexibility", "mocking for unit testing"],
          idealApproach: "Define a PaymentGateway interface with standard processPayment() methods, and inject the concrete implementation via a Factory or Dependency Injection container.",
          sampleAnswer: "I would define a common IPaymentGateway interface with standardized methods such as processPayment() and refundTransaction(). Concrete classes like StripeGateway and PayPalGateway implement this interface. The payment service depends strictly on the interface abstraction rather than concrete classes, adhering to the Dependency Inversion Principle of SOLID. Using Dependency Injection, the application runtime provides the appropriate gateway instance, allowing seamless switching and simple mocking during automated unit testing."
        },
        {
          id: "se-q5",
          title: "Production Incident Debugging & Root Cause Analysis",
          difficulty: "ADVANCED",
          category: "TROUBLESHOOTING & RELIABILITY",
          scenario: "Your production service experiences a sudden spike in 500 Internal Server Errors following a recent release. Walk through your step-by-step incident response and debugging workflow.",
          hint: "Discuss log monitoring, rollback strategies, isolating recent commits, post-mortem root cause analysis (RCA), and automated health checks.",
          keywords: ["incident response", "logs", "rollback", "root cause analysis", "monitoring", "metrics", "500 error", "post-mortem", "health check"],
          tradeoffConcepts: ["immediate rollback vs hotfix in place", "service availability vs deep investigation speed"],
          idealApproach: "Prioritize service availability with rapid rollback if needed, inspect error aggregation logs, reproduce locally, deploy a tested fix, and document a blameless post-mortem.",
          sampleAnswer: "My first priority is mitigating user impact: if the error rate exceeds critical thresholds, I initiate an immediate rollback to the last verified stable build. Simultaneously, I inspect centralized monitoring dashboards and error logs to identify stack traces and correlated release commits. Once the root cause is isolated (e.g., an unhandled database connection timeout or null pointer), I write a regression test reproducing the issue, deploy a hotfix through the CI/CD pipeline, and conduct a blameless post-mortem to implement preventive automated test checks."
        }
      ],

      "Frontend Developer": [
        {
          id: "fe-q1",
          title: "DOM Rendering Lifecycle & Frontend Performance Optimization",
          difficulty: "INTERMEDIATE",
          category: "WEB ARCHITECTURE",
          scenario: "A complex web page with dynamic list updates experiences noticeable UI jank and frame drops during scrolling. How do you diagnose and eliminate unnecessary reflows and repaints?",
          hint: "Discuss virtual DOM / document fragments, CSS transforms, debouncing, virtualization (windowing), and browser DevTools profiling.",
          keywords: ["reflow", "repaint", "virtualization", "devtools", "performance", "dom", "transform", "debounce", "framerate", "fps"],
          tradeoffConcepts: ["virtual DOM reconciliation cost vs direct DOM manipulation", "list windowing memory usage"],
          idealApproach: "Profile with Chrome DevTools Performance tab, minimize layout thrashing, utilize CSS transform/opacity for GPU acceleration, and apply list virtualization for large datasets.",
          sampleAnswer: "I would use Chrome DevTools Performance tab to record frame rates and identify long tasks triggering expensive layout reflows. To optimize rendering, I batch DOM updates using DocumentFragments or React state batching, replace margin/top animations with hardware-accelerated CSS transform and opacity properties, debounce window scroll listeners, and apply list virtualization (windowing) so only items visible within the viewport are rendered in the DOM tree."
        },
        {
          id: "fe-q2",
          title: "Asynchronous State Management & Race Condition Handling",
          difficulty: "INTERMEDIATE",
          category: "JAVASCRIPT / REACT",
          scenario: "When a user rapidly types queries in a search input, earlier network responses sometimes resolve after later queries, causing stale data to overwrite fresh search results. How do you resolve this race condition?",
          hint: "Discuss AbortController, request cancellation, debouncing, and React effect cleanup functions.",
          keywords: ["abortcontroller", "async", "race condition", "debounce", "cancel", "fetch", "useeffect", "stale data", "state"],
          tradeoffConcepts: ["client-side debouncing delay vs server request load", "aborting network requests"],
          idealApproach: "Utilize AbortController in fetch requests with cleanup handlers in useEffect, coupled with debouncing the user input stream.",
          sampleAnswer: "To prevent asynchronous search race conditions, I combine input debouncing with the browser's native AbortController API. In React, inside the useEffect hook, I instantiate an AbortController and pass its signal into the fetch request. In the effect's cleanup function, I call controller.abort(), automatically cancelling in-flight requests when the query state changes before the previous response arrives. This guarantees only the latest user query updates the UI state."
        },
        {
          id: "fe-q3",
          title: "Responsive Layout Architecture & Accessibility (a11y)",
          difficulty: "BEGINNER",
          category: "CSS & ACCESSIBILITY",
          scenario: "Explain how you build a responsive, accessible navigation drawer that works seamlessly across 360px mobile viewports up to 4K desktop screens, ensuring full keyboard and screen-reader support.",
          hint: "Discuss media queries, rem units, ARIA attributes (aria-expanded, aria-hidden), focus trap, and keyboard navigation (Tab/Esc).",
          keywords: ["responsive", "css grid", "flexbox", "aria", "accessibility", "focus trap", "keyboard navigation", "media query", "rem"],
          tradeoffConcepts: ["custom accessible UI widgets vs native HTML elements", "mobile drawer usability"],
          idealApproach: "Use CSS Grid/Flexbox with fluid rem units, manage aria-expanded attributes for assistive technology, and implement a focus trap ensuring keyboard users can navigate and exit via the Escape key.",
          sampleAnswer: "I build responsive layouts mobile-first using CSS Flexbox, Grid, and relative rem/em units with defined media query breakpoints. For accessibility (WCAG 2.1 AA), the navigation drawer button uses aria-expanded and aria-controls attributes. When the mobile drawer opens, I implement an accessible focus trap that confines Tab navigation inside the menu and listens for the Escape key to close the drawer, restoring focus back to the trigger button."
        },
        {
          id: "fe-q4",
          title: "React Component Lifecycle & Custom Hook Architecture",
          difficulty: "INTERMEDIATE",
          category: "REACT ARCHITECTURE",
          scenario: "When should you extract component logic into a Custom Hook, and how do you ensure memoization hooks (useMemo, useCallback) are used effectively without premature optimization?",
          hint: "Discuss code reusability, separation of UI and business logic, dependency arrays, and referential equality.",
          keywords: ["custom hook", "react", "usememo", "usecallback", "memoization", "referential equality", "reusability", "dependency array"],
          tradeoffConcepts: ["memoization overhead vs component re-render cost", "clean separation of concerns"],
          idealApproach: "Extract shared stateful logic into custom hooks; use useCallback/useMemo when passing functions or heavy computations to memoized child components to preserve referential integrity.",
          sampleAnswer: "Custom hooks should be extracted whenever stateful business logic (such as API data fetching, form handling, or window resize tracking) can be decoupled from UI rendering and reused across multiple components. I use useCallback and useMemo selectively: specifically when passing callbacks or expensive computed objects to React.memo child components to prevent unnecessary re-renders caused by new object references, while avoiding premature optimization on trivial inline calculations."
        },
        {
          id: "fe-q5",
          title: "Frontend Build Optimization & Bundle Splitting",
          difficulty: "ADVANCED",
          category: "BUILD TOOLS & DEPLOYMENT",
          scenario: "Your production JavaScript bundle size has grown to 3MB, causing slow initial page load times on mobile connections. How do you analyze and optimize the bundle?",
          hint: "Discuss code splitting (React.lazy / dynamic import), tree shaking, bundle analyzers, and image/asset compression.",
          keywords: ["bundle size", "code splitting", "tree shaking", "dynamic import", "lazy loading", "webpack", "vite", "lighthouse", "performance"],
          tradeoffConcepts: ["granular chunk splitting vs HTTP request count", "preloading critical routes"],
          idealApproach: "Analyze bundle composition with bundle visualizers, apply route-based code splitting via dynamic imports, verify ES module tree shaking, and optimize static assets.",
          sampleAnswer: "I would run a bundle analyzer (e.g. rollup-plugin-visualizer or webpack-bundle-analyzer) to identify bloated third-party dependencies. Then, I implement route-based code splitting using React.lazy() and dynamic import() statements so users only download the JavaScript required for the initial route. I ensure libraries support ES module tree-shaking, replace heavy packages with lighter alternatives (e.g. date-fns instead of Moment.js), and configure aggressive Gzip/Brotli compression on the web server."
        }
      ]
    };

    return catalogs[target] || catalogs["Software Engineer"];
  },

  /**
   * Load Saved Data
   */
  loadData() {
    try {
      const interviewRaw = localStorage.getItem(INTERVIEW_STORAGE_KEY);
      if (interviewRaw) this.interviewData = JSON.parse(interviewRaw);
      else this.interviewData = { targetCareer: this.readiness.targetCareer, completedAnswers: {}, overallScore: 0 };

      const toolsRaw = localStorage.getItem(CAREER_TOOLS_STORAGE_KEY);
      if (toolsRaw) this.careerToolsData = JSON.parse(toolsRaw);
      else this.careerToolsData = { projectEvidence: {} };
    } catch (e) {
      this.interviewData = { targetCareer: this.readiness.targetCareer, completedAnswers: {}, overallScore: 0 };
      this.careerToolsData = { projectEvidence: {} };
    }
  },

  /**
   * Get Current Question Object
   */
  getCurrentQuestion() {
    const questions = this.getCareerQuestions();
    return questions[this.currentQuestionIndex] || questions[0];
  },

  /**
   * Deterministic Answer Evaluation Engine
   */
  evaluateCurrentAnswer() {
    const answerInput = document.getElementById('user-answer-input');
    if (!answerInput) return;

    const answerText = answerInput.value.trim();
    if (answerText.length < 15) {
      alert("Please provide a more detailed response (at least a few sentences) to evaluate your interview readiness.");
      return;
    }

    const q = this.getCurrentQuestion();
    const evaluation = this.calculateEvaluation(answerText, q);

    // Save answer evaluation
    if (!this.interviewData) this.interviewData = { targetCareer: this.readiness.targetCareer, completedAnswers: {}, overallScore: 0 };
    this.interviewData.completedAnswers[q.id] = {
      userAnswer: answerText,
      evaluation: evaluation,
      evaluatedAt: new Date().toISOString()
    };

    // Calculate overall interview score
    const allAnswerKeys = Object.keys(this.interviewData.completedAnswers);
    let totalScoreSum = 0;
    allAnswerKeys.forEach(k => {
      totalScoreSum += this.interviewData.completedAnswers[k].evaluation.overallScore;
    });
    this.interviewData.overallScore = Math.round(totalScoreSum / (allAnswerKeys.length || 1));

    this.saveInterviewData();
    this.renderEvaluationResults(evaluation);
    this.renderReadinessAudit();
  },

  /**
   * Deterministic Evaluation Scoring Calculation
   */
  calculateEvaluation(text, question) {
    const lowerText = text.toLowerCase();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // 1. Technical Depth Score (0-100) based on keyword vector matches
    const keywords = question.keywords || [];
    let matchedKeywords = 0;
    const matchedList = [];
    const missingList = [];

    keywords.forEach(kw => {
      if (lowerText.includes(kw.toLowerCase())) {
        matchedKeywords++;
        matchedList.push(kw);
      } else {
        missingList.push(kw);
      }
    });

    const keywordRatio = keywords.length > 0 ? (matchedKeywords / keywords.length) : 0.8;
    let technicalScore = Math.round(keywordRatio * 75 + (wordCount >= 60 ? 25 : (wordCount / 60) * 25));
    technicalScore = Math.max(30, Math.min(100, technicalScore));

    // 2. Communication Clarity Score (0-100)
    // Evaluates sentence formation, length, paragraphs, and structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const hasParagraphs = text.includes('\n');
    let communicationScore = 50;

    if (wordCount >= 40) communicationScore += 20;
    if (wordCount >= 90) communicationScore += 15;
    if (sentences.length >= 3) communicationScore += 10;
    if (hasParagraphs) communicationScore += 5;
    communicationScore = Math.max(35, Math.min(100, communicationScore));

    // 3. Problem Solving Score (0-100)
    // Looks for trade-off terms, architectural reasoning, and edge-case keywords
    const problemSolvingKeywords = [
      "tradeoff", "trade-off", "performance", "scale", "latency", "memory", "complexity",
      "edge case", "alternative", "optimize", "handling", "mitigate", "bottleneck", "security"
    ];
    let matchedProbTerms = 0;
    problemSolvingKeywords.forEach(term => {
      if (lowerText.includes(term)) matchedProbTerms++;
    });

    let problemSolvingScore = 40 + (matchedProbTerms * 15);
    if (wordCount >= 80) problemSolvingScore += 10;
    problemSolvingScore = Math.max(30, Math.min(100, problemSolvingScore));

    // Overall Combined Score
    const overallScore = Math.round(technicalScore * 0.45 + communicationScore * 0.25 + problemSolvingScore * 0.30);

    // Qualitative Strengths & Weaknesses
    const strengths = [];
    const weaknesses = [];

    if (technicalScore >= 75) strengths.push("Strong domain terminology & keyword precision");
    else weaknesses.push("Incorporate deeper technical terms (e.g. " + missingList.slice(0, 2).join(", ") + ")");

    if (communicationScore >= 75) strengths.push("Clear, structured multi-sentence explanation");
    else weaknesses.push("Elaborate on concrete steps and format with clear paragraph breaks");

    if (problemSolvingScore >= 75) strengths.push("Evaluates trade-offs, complexity, and performance factors");
    else weaknesses.push("Discuss memory/performance trade-offs and edge-case handling");

    if (strengths.length === 0) strengths.push("Established basic baseline technical awareness");
    if (weaknesses.length === 0) weaknesses.push("Further quantify real-world benchmark metrics");

    // Constructive Feedback Text
    let feedback = "";
    if (overallScore >= 80) {
      feedback = "Excellent response. Your answer demonstrates strong technical depth, accurate domain concepts, and structured reasoning addressing trade-offs and scalability.";
    } else if (overallScore >= 60) {
      feedback = "Solid foundation. Your answer covers core principles well. To make this answer interview-ready for top roles, elaborate more specifically on trade-offs and architectural edge cases.";
    } else {
      feedback = "Developing response. Focus on expanding technical detail, mentioning specific design patterns, and explicitly analyzing performance considerations.";
    }

    let statusLabel = "DEVELOPING";
    if (overallScore >= 85) statusLabel = "EXCEPTIONAL";
    else if (overallScore >= 70) statusLabel = "STRONG RESPONSE";
    else if (overallScore >= 50) statusLabel = "DEVELOPING";
    else statusLabel = "NEEDS REFINEMENT";

    return {
      technicalScore: technicalScore,
      communicationScore: communicationScore,
      problemSolvingScore: problemSolvingScore,
      overallScore: overallScore,
      statusLabel: statusLabel,
      feedback: feedback,
      strengths: strengths,
      weaknesses: weaknesses,
      idealApproach: question.idealApproach || "Structure the answer systematically using the STAR technique."
    };
  },

  /**
   * Save Interview Data
   */
  saveInterviewData() {
    try {
      localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(this.interviewData));
    } catch (e) {
      console.error('Error saving interview data:', e);
    }
  },

  /**
   * Save Career Tools Data
   */
  saveCareerToolsData() {
    try {
      localStorage.setItem(CAREER_TOOLS_STORAGE_KEY, JSON.stringify(this.careerToolsData));
    } catch (e) {
      console.error('Error saving career tools data:', e);
    }
  },

  /**
   * Render Question View
   */
  renderQuestionView() {
    const questions = this.getCareerQuestions();
    const q = this.getCurrentQuestion();
    if (!q) return;

    // Progress counter
    const currNum = document.getElementById('q-curr-num');
    const totalNum = document.getElementById('q-total-num');
    if (currNum) currNum.textContent = this.currentQuestionIndex + 1;
    if (totalNum) totalNum.textContent = questions.length;

    // Dots navigation
    const dotsContainer = document.getElementById('question-nav-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      questions.forEach((item, idx) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'q-dot-btn';
        if (idx === this.currentQuestionIndex) dot.classList.add('active');
        if (this.interviewData && this.interviewData.completedAnswers && this.interviewData.completedAnswers[item.id]) {
          dot.classList.add('answered');
        }
        dot.textContent = idx + 1;
        dot.addEventListener('click', () => {
          this.currentQuestionIndex = idx;
          this.renderQuestionView();
        });
        dotsContainer.appendChild(dot);
      });
    }

    // Question content
    const titleEl = document.getElementById('q-title');
    const scenarioEl = document.getElementById('q-scenario');
    const hintEl = document.getElementById('q-hint');
    const catBadge = document.getElementById('q-category-badge');
    const diffBadge = document.getElementById('q-difficulty-badge');

    if (titleEl) titleEl.textContent = q.title;
    if (scenarioEl) scenarioEl.textContent = q.scenario;
    if (hintEl) hintEl.textContent = q.hint;
    if (catBadge) catBadge.textContent = q.category || 'TECHNICAL';
    if (diffBadge) {
      diffBadge.textContent = q.difficulty;
      diffBadge.className = 'diff-badge diff-' + q.difficulty.toLowerCase();
    }

    // Answer textarea
    const answerInput = document.getElementById('user-answer-input');
    const charCount = document.getElementById('answer-char-count');

    if (answerInput) {
      if (this.interviewData && this.interviewData.completedAnswers && this.interviewData.completedAnswers[q.id]) {
        answerInput.value = this.interviewData.completedAnswers[q.id].userAnswer || '';
        this.renderEvaluationResults(this.interviewData.completedAnswers[q.id].evaluation);
      } else {
        answerInput.value = '';
        const evalCard = document.getElementById('evaluation-card');
        if (evalCard) evalCard.style.display = 'none';
      }
      if (charCount) charCount.textContent = answerInput.value.length + " characters";
    }
  },

  /**
   * Render Evaluation Results Card
   */
  renderEvaluationResults(evalData) {
    if (!evalData) return;
    const evalCard = document.getElementById('evaluation-card');
    if (!evalCard) return;

    const statusEl = document.getElementById('eval-overall-status');
    const techScoreEl = document.getElementById('eval-tech-score');
    const techBar = document.getElementById('eval-tech-bar');
    const commScoreEl = document.getElementById('eval-comm-score');
    const commBar = document.getElementById('eval-comm-bar');
    const probScoreEl = document.getElementById('eval-prob-score');
    const probBar = document.getElementById('eval-prob-bar');
    const feedbackEl = document.getElementById('eval-feedback-text');
    const strengthsContainer = document.getElementById('eval-strengths-list');
    const weaknessesContainer = document.getElementById('eval-weaknesses-list');
    const idealApproachEl = document.getElementById('eval-ideal-approach');

    if (statusEl) {
      statusEl.textContent = evalData.statusLabel || "EVALUATED";
      statusEl.className = evalData.overallScore >= 70 ? 'alignment-badge alignment-badge-high' : 'alignment-badge alignment-badge-medium';
    }

    if (techScoreEl) techScoreEl.textContent = evalData.technicalScore + " / 100";
    if (techBar) techBar.style.width = evalData.technicalScore + "%";

    if (commScoreEl) commScoreEl.textContent = evalData.communicationScore + " / 100";
    if (commBar) commBar.style.width = evalData.communicationScore + "%";

    if (probScoreEl) probScoreEl.textContent = evalData.problemSolvingScore + " / 100";
    if (probBar) probBar.style.width = evalData.problemSolvingScore + "%";

    if (feedbackEl) feedbackEl.textContent = evalData.feedback;
    if (idealApproachEl) idealApproachEl.textContent = evalData.idealApproach;

    if (strengthsContainer) {
      strengthsContainer.innerHTML = '';
      (evalData.strengths || []).forEach(s => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag skill-tag-met';
        tag.textContent = '✓ ' + s;
        strengthsContainer.appendChild(tag);
      });
    }

    if (weaknessesContainer) {
      weaknessesContainer.innerHTML = '';
      (evalData.weaknesses || []).forEach(w => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        tag.style.color = '#f87171';
        tag.textContent = '▲ ' + w;
        weaknessesContainer.appendChild(tag);
      });
    }

    evalCard.style.display = 'block';

    // Update overall header status
    const headerStatus = document.getElementById('iv-interview-status');
    if (headerStatus && this.interviewData) {
      headerStatus.textContent = this.interviewData.overallScore + "% INTERVIEW SCORE";
    }
  },

  /**
   * Render 4-Tier Career Readiness Audit
   */
  renderReadinessAudit() {
    // 1. Profile Completeness
    const icon1 = document.getElementById('audit-icon-1');
    const desc1 = document.getElementById('audit-desc-1');
    if (icon1 && desc1) {
      icon1.textContent = '✓';
      icon1.className = 'audit-icon text-green';
      desc1.textContent = 'Profile complete: ' + (this.profile.personal ? this.profile.personal.fullName : 'Verified') + ' (' + (this.profile.education ? this.profile.education.degree : 'Degree') + ')';
    }

    // 2. Skill Gap Coverage
    const icon2 = document.getElementById('audit-icon-2');
    const desc2 = document.getElementById('audit-desc-2');
    if (icon2 && desc2) {
      const score = this.readiness.score || 0;
      icon2.textContent = score >= 50 ? '✓' : '⚙';
      icon2.className = score >= 50 ? 'audit-icon text-green' : 'audit-icon text-amber';
      desc2.textContent = 'Readiness Score: ' + score + '/100 (' + (this.readiness.metSkills ? this.readiness.metSkills.length : 0) + ' requirements satisfied)';
    }

    // 3. Project Proof
    const icon3 = document.getElementById('audit-icon-3');
    const desc3 = document.getElementById('audit-desc-3');
    if (icon3 && desc3) {
      const compProjects = this.projects ? (this.projects.completedProjects || 0) : 0;
      const inProgProjects = this.projects ? (this.projects.inProgressProjects || 0) : 0;
      if (compProjects > 0) {
        icon3.textContent = '✓';
        icon3.className = 'audit-icon text-green';
      } else if (inProgProjects > 0) {
        icon3.textContent = '⚙';
        icon3.className = 'audit-icon text-amber';
      } else {
        icon3.textContent = '○';
        icon3.className = 'audit-icon';
      }
      desc3.textContent = compProjects + ' projects completed, ' + inProgProjects + ' in progress in portfolio tracker.';
    }

    // 4. Interview Readiness
    const icon4 = document.getElementById('audit-icon-4');
    const desc4 = document.getElementById('audit-desc-4');
    if (icon4 && desc4) {
      const ivScore = this.interviewData ? (this.interviewData.overallScore || 0) : 0;
      const ansCount = this.interviewData && this.interviewData.completedAnswers ? Object.keys(this.interviewData.completedAnswers).length : 0;
      if (ansCount > 0) {
        icon4.textContent = ivScore >= 65 ? '✓' : '⚙';
        icon4.className = ivScore >= 65 ? 'audit-icon text-green' : 'audit-icon text-amber';
        desc4.textContent = ansCount + ' questions completed. Average score: ' + ivScore + '/100.';
      } else {
        icon4.textContent = '○';
        icon4.className = 'audit-icon';
        desc4.textContent = 'Complete interview questions in Tab 1 to unlock score verification.';
      }
    }
  },

  /**
   * Generate Markdown Resume
   */
  generateMarkdownResume() {
    const p = this.profile || {};
    const name = (p.personal && p.personal.fullName) ? p.personal.fullName : "Candidate Name";
    const email = (p.personal && p.personal.email) ? p.personal.email : "email@example.com";
    const target = this.readiness.targetCareer || (p.careerGoal ? p.careerGoal.targetCareer : "Software Engineer");
    const degree = (p.education && p.education.degree) ? p.education.degree : "Computer Science";
    const skills = p.skills || [];
    const projectsList = (this.projects && this.projects.projects) ? this.projects.projects : [];

    let resume = `# ${name}\n`;
    resume += `**Target Role:** ${target} | **Email:** ${email}\n\n`;
    resume += `---\n\n`;
    resume += `## Professional Summary\n`;
    resume += `Goal-oriented ${target} with a strong foundation in ${skills.slice(0, 4).join(', ')}. Demonstrated technical readiness (Readiness Score: ${this.readiness.score || 0}/100) and hands-on portfolio implementation.\n\n`;
    resume += `## Education\n`;
    resume += `- **${degree}**\n\n`;
    resume += `## Core Technical Skills\n`;
    resume += `- **Verified Skills:** ${skills.join(', ')}\n\n`;
    resume += `## Key Portfolio Projects\n`;

    projectsList.forEach(proj => {
      resume += `### ${proj.title} (${proj.difficulty})\n`;
      resume += `- **Description:** ${proj.description}\n`;
      resume += `- **Skills Covered:** ${(proj.skillsCovered || []).join(', ')}\n`;
      resume += `- **Tech Stack:** ${(proj.techStack || []).join(', ')}\n\n`;
    });

    return resume;
  },

  /**
   * Render Resume Preview Box
   */
  renderResumePreview() {
    const previewBox = document.getElementById('resume-preview-box');
    if (!previewBox) return;

    const p = this.profile || {};
    const name = (p.personal && p.personal.fullName) ? p.personal.fullName : "Candidate Name";
    const email = (p.personal && p.personal.email) ? p.personal.email : "email@example.com";
    const target = this.readiness.targetCareer || (p.careerGoal ? p.careerGoal.targetCareer : "Software Engineer");
    const degree = (p.education && p.education.degree) ? p.education.degree : "Computer Science";
    const skills = p.skills || [];
    const projectsList = (this.projects && this.projects.projects) ? this.projects.projects.slice(0, 4) : [];

    let projHtml = '';
    projectsList.forEach(proj => {
      projHtml += `
        <div style="margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; color: var(--text-primary);">
            <span>${proj.title}</span>
            <span style="font-size: 0.75rem; color: var(--accent-red-bright);">${proj.difficulty}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">${proj.description}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
            <strong>Tech Stack:</strong> ${(proj.techStack || []).join(', ')}
          </div>
        </div>
      `;
    });

    previewBox.innerHTML = `
      <div style="text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1rem;">
        <h2 style="font-size: 1.5rem; margin: 0 0 0.25rem 0; color: var(--text-primary);">${name}</h2>
        <div style="font-size: 0.85rem; color: var(--text-secondary);">
          <span>${target}</span> &bull; <span>${email}</span>
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-red-bright); text-transform: uppercase; margin-bottom: 0.3rem;">
          EDUCATION
        </div>
        <div style="font-size: 0.9rem; color: var(--text-primary); font-weight: 500;">${degree}</div>
      </div>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-red-bright); text-transform: uppercase; margin-bottom: 0.3rem;">
          TECHNICAL SKILLS
        </div>
        <div class="tags-container">
          ${skills.map(s => `<span class="skill-tag skill-tag-met">✓ ${s}</span>`).join('')}
        </div>
      </div>

      <div>
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-red-bright); text-transform: uppercase; margin-bottom: 0.5rem;">
          KEY PORTFOLIO PROJECTS
        </div>
        ${projHtml}
      </div>
    `;
  },

  /**
   * Render Evidence Tracker
   */
  renderEvidenceTracker() {
    const list = document.getElementById('evidence-projects-list');
    if (!list) return;

    const projectsList = (this.projects && this.projects.projects) ? this.projects.projects : [];
    const evidenceMap = (this.careerToolsData && this.careerToolsData.projectEvidence) ? this.careerToolsData.projectEvidence : {};

    list.innerHTML = '';

    projectsList.forEach(proj => {
      const ev = evidenceMap[proj.id] || { githubUrl: '', liveUrl: '', notes: '' };
      const itemCard = document.createElement('div');
      itemCard.className = 'onboarding-card evidence-item-card';
      itemCard.style.marginBottom = '1rem';

      itemCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
          <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">${proj.title}</h3>
          <span class="diff-badge diff-${proj.difficulty.toLowerCase()}">${proj.difficulty}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 0.75rem 0;">${proj.description}</p>
        
        <div class="form-grid-2" style="gap: 0.75rem;">
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">GitHub Repository URL:</label>
            <input type="url" class="form-input evidence-github-input" data-proj-id="${proj.id}" value="${ev.githubUrl || ''}" placeholder="https://github.com/username/repository" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; margin-top: 0.2rem;">
          </div>
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Live Demo / Deployment URL:</label>
            <input type="url" class="form-input evidence-live-input" data-proj-id="${proj.id}" value="${ev.liveUrl || ''}" placeholder="https://project-demo.com" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; margin-top: 0.2rem;">
          </div>
        </div>
      `;

      list.appendChild(itemCard);
    });
  },

  /**
   * Save Evidence From Input Fields
   */
  saveEvidenceFromInputs() {
    if (!this.careerToolsData) this.careerToolsData = { projectEvidence: {} };
    if (!this.careerToolsData.projectEvidence) this.careerToolsData.projectEvidence = {};

    const ghInputs = document.querySelectorAll('.evidence-github-input');
    const liveInputs = document.querySelectorAll('.evidence-live-input');

    ghInputs.forEach(input => {
      const pId = input.dataset.projId;
      if (!this.careerToolsData.projectEvidence[pId]) this.careerToolsData.projectEvidence[pId] = {};
      this.careerToolsData.projectEvidence[pId].githubUrl = input.value.trim();
    });

    liveInputs.forEach(input => {
      const pId = input.dataset.projId;
      if (!this.careerToolsData.projectEvidence[pId]) this.careerToolsData.projectEvidence[pId] = {};
      this.careerToolsData.projectEvidence[pId].liveUrl = input.value.trim();
    });

    this.saveCareerToolsData();

    const alertBox = document.getElementById('evidence-saved-alert');
    if (alertBox) {
      alertBox.style.display = 'block';
      setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
    }
  },

  /**
   * Populate Passport Summary Modal
   */
  populatePassportModal() {
    const p = this.profile || {};
    const nameEl = document.getElementById('pass-candidate-name');
    const targetEl = document.getElementById('pass-target-career');
    const scoreEl = document.getElementById('pass-readiness-score');
    const statusEl = document.getElementById('pass-readiness-status');
    const skillsContainer = document.getElementById('pass-skills-list');
    const projContainer = document.getElementById('pass-projects-list');

    if (nameEl) nameEl.textContent = (p.personal && p.personal.fullName) ? p.personal.fullName : "Candidate";
    if (targetEl) targetEl.textContent = this.readiness.targetCareer || "Software Engineer";
    if (scoreEl) scoreEl.textContent = (this.readiness.score || 0) + " / 100";
    if (statusEl) statusEl.textContent = this.readiness.status || "DEVELOPING";

    if (skillsContainer) {
      skillsContainer.innerHTML = '';
      (p.skills || []).forEach(s => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag skill-tag-met';
        tag.textContent = '✓ ' + s;
        skillsContainer.appendChild(tag);
      });
    }

    if (projContainer) {
      projContainer.innerHTML = '';
      const projectsList = (this.projects && this.projects.projects) ? this.projects.projects : [];
      const evidenceMap = (this.careerToolsData && this.careerToolsData.projectEvidence) ? this.careerToolsData.projectEvidence : {};

      projectsList.forEach(proj => {
        const ev = evidenceMap[proj.id];
        const row = document.createElement('div');
        row.style.padding = '0.35rem 0';
        row.style.borderBottom = '1px solid var(--border-color)';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';

        const links = [];
        if (ev && ev.githubUrl) links.push(`<a href="${ev.githubUrl}" target="_blank" style="color: var(--accent-red-bright); text-decoration: none;">GitHub</a>`);
        if (ev && ev.liveUrl) links.push(`<a href="${ev.liveUrl}" target="_blank" style="color: var(--accent-red-bright); text-decoration: none;">Live Demo</a>`);

        row.innerHTML = `
          <span style="color: var(--text-primary); font-weight: 500;">${proj.title}</span>
          <span>${links.length > 0 ? links.join(' &bull; ') : '<span style="color: var(--text-muted);">Proof Pending</span>'}</span>
        `;
        projContainer.appendChild(row);
      });
    }
  },

  /**
   * Render All Views
   */
  renderAll() {
    // Header info
    const targetEl = document.getElementById('iv-target-career');
    if (targetEl) targetEl.textContent = this.readiness.targetCareer;

    const scoreEl = document.getElementById('iv-readiness-score');
    if (scoreEl) scoreEl.textContent = (this.readiness.score || 0) + " / 100";

    this.renderQuestionView();
    this.renderReadinessAudit();
    this.renderResumePreview();
    this.renderEvidenceTracker();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  InterviewApp.init();
});
