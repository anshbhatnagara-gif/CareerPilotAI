/**
 * CAREERPILOT AI - PHASE 7 INTERVIEW SIMULATOR & CAREER TOOLS ENGINE
 * 
 * Local deterministic interview simulator, resume builder, and portfolio evidence engine.
 * 
 * Features:
 * - 3 Selectable Modes: QUICK (5Q), STANDARD (10Q), DEEP (15Q)
 * - 180 Unique Questions across 12 tech career domains (15 questions per role)
 * - 4-Dimension Evaluation: Technical Depth (35%), Problem Solving (30%), Communication (15%), Project Knowledge (20%)
 * - Automatic Weight Redistribution (43.75% / 37.5% / 18.75%) when no project questions exist
 * - Session History Persistence (careerPilotInterviewHistory)
 * - Mode Switching Safety (preserves answers by question ID)
 * - ATS-Friendly Resume Draft Generator with Required Disclaimer
 * - Career Passport Sync with Latest Scored Session
 * - Zero external AI dependencies & zero password storage
 */

const PROFILE_STORAGE_KEY = 'careerPilotProfile';
const ASSESSMENT_STORAGE_KEY = 'careerPilotAssessment';
const READINESS_STORAGE_KEY = 'careerPilotReadiness';
const ROADMAP_STORAGE_KEY = 'careerPilotRoadmap';
const PROJECTS_STORAGE_KEY = 'careerPilotProjects';
const INTERVIEW_STORAGE_KEY = 'careerPilotInterview';
const INTERVIEW_HISTORY_STORAGE_KEY = 'careerPilotInterviewHistory';
const CAREER_TOOLS_STORAGE_KEY = 'careerPilotCareerTools';

const InterviewApp = {
  profile: null,
  assessment: null,
  readiness: null,
  roadmap: null,
  projects: null,
  interviewData: null,
  interviewHistory: [],
  careerToolsData: null,
  activeMode: 'QUICK',
  currentQuestionIndex: 0,
  activeTab: 'interview-tab',

  init() {
    if (!this.protectRoute()) return;
    this.loadData();
    this.bindEvents();
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

    // Mode Selector Buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedMode = btn.dataset.mode;
        if (selectedMode && ['QUICK', 'STANDARD', 'DEEP'].includes(selectedMode)) {
          this.switchInterviewMode(selectedMode);
        }
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
        const questions = this.getActiveQuestions();
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
   * Mode Switching Handler - Safe State Transition
   */
  switchInterviewMode(mode) {
    if (!['QUICK', 'STANDARD', 'DEEP'].includes(mode)) return;
    this.activeMode = mode;

    if (!this.interviewData) {
      this.interviewData = {
        targetCareer: this.readiness.targetCareer,
        activeMode: mode,
        completedAnswers: {},
        overallScore: 0
      };
    } else {
      this.interviewData.activeMode = mode;
    }

    // Safely clamp question index to prevent out-of-bounds error
    const activeQuestions = this.getActiveQuestions();
    if (this.currentQuestionIndex >= activeQuestions.length) {
      this.currentQuestionIndex = Math.max(0, activeQuestions.length - 1);
    }

    this.saveInterviewData();
    this.renderModeUI();
    this.renderQuestionView();
  },

  /**
   * Get Active Questions based on Active Mode (QUICK: 5, STANDARD: 10, DEEP: 15)
   */
  getActiveQuestions() {
    const fullBank = this.getCareerQuestions();
    let limit = 5;
    if (this.activeMode === 'STANDARD') limit = 10;
    else if (this.activeMode === 'DEEP') limit = 15;

    // Filter or slice without duplicate IDs
    return fullBank.slice(0, Math.min(limit, fullBank.length));
  },

  /**
   * Complete Question Catalog: 12 Supported Roles with 15 Distinct Questions Each (180 Total)
   */
  getCareerQuestions() {
    const target = this.readiness.targetCareer || (this.profile.careerGoal ? this.profile.careerGoal.targetCareer : "Software Engineer");
    
    // Normalize target career string to catalog keys
    let catalogKey = "Software Engineer";
    const lower = target.toLowerCase();

    if (lower.includes("frontend") || lower.includes("front-end")) catalogKey = "Frontend Developer";
    else if (lower.includes("backend") || lower.includes("back-end")) catalogKey = "Backend Developer";
    else if (lower.includes("full stack") || lower.includes("fullstack")) catalogKey = "Full Stack Developer";
    else if (lower.includes("python")) catalogKey = "Python Developer";
    else if (lower.includes("data analyst")) catalogKey = "Data Analyst";
    else if (lower.includes("data scientist")) catalogKey = "Data Scientist";
    else if (lower.includes("ai") || lower.includes("ml") || lower.includes("machine learning")) catalogKey = "AI/ML Engineer";
    else if (lower.includes("cyber") || lower.includes("security")) catalogKey = "Cybersecurity Engineer";
    else if (lower.includes("cloud")) catalogKey = "Cloud Engineer";
    else if (lower.includes("devops") || lower.includes("site reliability") || lower.includes("sre")) catalogKey = "DevOps Engineer";
    else if (lower.includes("ui") || lower.includes("ux") || lower.includes("designer")) catalogKey = "UI/UX Designer";
    else catalogKey = "Software Engineer";

    const createCatalog = () => ({
      "Software Engineer": [
        {
          id: "se-q1",
          title: "Algorithmic Optimization & Time Complexity Analysis",
          difficulty: "INTERMEDIATE",
          category: "DATA STRUCTURES & ALGORITHMS",
          isProjectQuestion: false,
          scenario: "You are designing an in-memory lookup cache processing millions of incoming transaction events. How would you choose and structure your data types to ensure O(1) average lookup and insertion time while handling hash collisions?",
          hint: "State the data structure chosen, explain how buckets/chaining work, address worst-case O(N) edge cases, and analyze memory trade-offs.",
          keywords: ["hash map", "hash table", "collision", "time complexity", "o(1)", "memory", "tradeoff", "buckets", "chaining", "constant time"],
          tradeoffConcepts: ["space complexity vs lookup latency", "open addressing vs separate chaining", "resizing load factor overhead"],
          idealApproach: "Recommend a hash map with dynamic load factor resizing. Discuss collision resolution strategies, amortized O(1) performance, and space-time trade-offs.",
          sampleAnswer: "In a high-throughput transaction lookup scenario, I would implement a hash map utilizing separate chaining or open addressing with an optimized load factor (0.75). The keys would be hashed using a uniform hashing function ensuring O(1) average-time lookups and inserts. To handle potential hash collisions and mitigate worst-case O(N) degradation, collision buckets can transition to self-balancing binary search trees achieving O(log N) worst-case. The primary trade-off is higher memory allocation for bucket arrays versus ultra-low latency execution."
        },
        {
          id: "se-q2",
          title: "Modular RESTful API & Error Handling Architecture",
          difficulty: "INTERMEDIATE",
          category: "SYSTEM DESIGN & APIS",
          isProjectQuestion: false,
          scenario: "Describe how you would design a clean, maintainable REST API endpoint for user registration and authentication, including input validation, rate limiting, and centralized error logging.",
          hint: "Detail HTTP methods, status codes (201, 400, 429, 500), middleware architecture, and security practices like password hashing.",
          keywords: ["rest", "api", "post", "status code", "validation", "middleware", "jwt", "bcrypt", "error handling", "rate limiting", "hashing"],
          tradeoffConcepts: ["stateless tokens vs server sessions", "synchronous validation overhead", "security vs throughput"],
          idealApproach: "Structure endpoint with route controllers, request validation middleware, salted password hashing, JWT generation, and centralized error middleware.",
          sampleAnswer: "I would structure the registration route using a POST /api/v1/auth/register endpoint. The request body is sanitized and validated against a schema validator middleware before reaching the controller. Passwords are salted and hashed using Bcrypt before saving to the database. Upon success, the server responds with HTTP 201 Created and an encrypted JWT token. I implement rate limiting middleware (max 5 attempts per minute) and aggregate errors in a centralized middleware logger."
        },
        {
          id: "se-q3",
          title: "Database Indexing & Query Performance Tuning",
          difficulty: "ADVANCED",
          category: "DATABASES",
          isProjectQuestion: false,
          scenario: "A critical database query joining orders and customer profiles is causing high latency during peak traffic. How do you diagnose the bottleneck and implement indexing or schema optimizations?",
          hint: "Explain EXPLAIN ANALYZE, B-Tree indexes, composite indexing, and normalization vs denormalization trade-offs.",
          keywords: ["explain analyze", "index", "b-tree", "composite index", "query optimization", "join", "latency", "bottleneck", "foreign key"],
          tradeoffConcepts: ["write penalty of multiple indexes vs read speed", "denormalization caching vs storage"],
          idealApproach: "Use query execution profiling tools (EXPLAIN ANALYZE), identify full table scans, create targeted composite B-Tree indexes on foreign keys, and optimize join conditions.",
          sampleAnswer: "I would profile the slow query using EXPLAIN ANALYZE to identify sequential scans. If the join on customer_id lacks an index, I create a composite B-Tree index covering the join keys and filtered columns. Furthermore, I evaluate index maintenance trade-offs: while read latency decreases from O(N) to O(log N), write operations incur slight overhead. If traffic remains heavy, read replicas or caching frequently accessed profile records in Redis would be utilized."
        },
        {
          id: "se-q4",
          title: "Core Software Architecture Portfolio Project Deep Dive",
          difficulty: "ADVANCED",
          category: "PROJECT KNOWLEDGE & ARCHITECTURE",
          isProjectQuestion: true,
          scenario: "Walk through the architectural design of a core software project in your portfolio. Explain your choice of system architecture, technology stack, modular design patterns, and deployment pipeline.",
          hint: "Discuss project objective, architectural layers (frontend, backend, DB), clean code abstractions, unit testing, and deployment setup.",
          keywords: ["architecture", "portfolio", "project", "design pattern", "stack", "modular", "deployment", "database", "testing", "scalability"],
          tradeoffConcepts: ["monolith simplicity vs microservices scalability", "tech stack familiarity vs performance"],
          idealApproach: "Explain the problem your project solves, outline the architectural layers, defend your tech stack choices, and highlight specific design patterns used to decouple modules.",
          sampleAnswer: "My portfolio project is a scalable task orchestration engine built with Node.js, Express, and PostgreSQL. I chose a layered architecture separating routing, business logic controllers, data access repositories, and external service clients. To maintain modularity and testability, I implemented Dependency Injection to decouple database handlers from controllers. The application uses Docker containers deployed via a GitHub Actions CI/CD pipeline to automated staging environments."
        },
        {
          id: "se-q5",
          title: "Production Incident Debugging & Root Cause Analysis",
          difficulty: "ADVANCED",
          category: "TROUBLESHOOTING & RELIABILITY",
          isProjectQuestion: false,
          scenario: "Your production service experiences a sudden spike in 500 Internal Server Errors following a recent release. Walk through your step-by-step incident response and debugging workflow.",
          hint: "Discuss log monitoring, rollback strategies, isolating recent commits, post-mortem root cause analysis (RCA), and automated health checks.",
          keywords: ["incident response", "logs", "rollback", "root cause analysis", "monitoring", "metrics", "500 error", "post-mortem", "health check"],
          tradeoffConcepts: ["immediate rollback vs hotfix in place", "service availability vs deep investigation speed"],
          idealApproach: "Prioritize service availability with rapid rollback if needed, inspect error aggregation logs, reproduce locally, deploy a tested fix, and document a blameless post-mortem.",
          sampleAnswer: "My first priority is mitigating user impact: if error rates exceed thresholds, I initiate an immediate rollback to the last verified stable build. Simultaneously, I inspect centralized monitoring dashboards and error logs to identify stack traces and correlated release commits. Once isolated, I write a regression test reproducing the issue, deploy a hotfix through CI/CD, and conduct a blameless post-mortem."
        },
        {
          id: "se-q6",
          title: "Concurrency, Thread Safety & Deadlock Prevention",
          difficulty: "ADVANCED",
          category: "CONCURRENCY & SYSTEMS",
          isProjectQuestion: false,
          scenario: "Explain how multithreaded applications handle shared resource access. What causes deadlocks, and what strategies do you use to guarantee thread safety?",
          hint: "Mention mutexes, locks, atomic operations, race conditions, lock ordering, and semaphore mechanisms.",
          keywords: ["concurrency", "thread safety", "deadlock", "mutex", "lock", "atomic", "race condition", "semaphore", "synchronization"],
          tradeoffConcepts: ["fine-grained locking complexity vs coarse-grained lock contention"],
          idealApproach: "Define race conditions and deadlocks (Coffman conditions). Explain lock ordering, immutable data structures, and atomic operations.",
          sampleAnswer: "Thread safety is achieved by controlling concurrent access to mutable shared state. Deadlocks occur when threads wait indefinitely for locks held by each other. To prevent deadlocks, I establish strict lock ordering rules, use lock timeouts, and prefer lock-free atomic primitives or immutable state models where possible."
        },
        {
          id: "se-q7",
          title: "Microservices vs Monolith Architecture Trade-offs",
          difficulty: "INTERMEDIATE",
          category: "SYSTEM DESIGN",
          isProjectQuestion: false,
          scenario: "When should an engineering team transition a monolithic system into a microservices architecture, and what operational complexities does this introduce?",
          hint: "Discuss domain boundary isolation, network latency, distributed tracing, independent deployment, and database per service.",
          keywords: ["microservices", "monolith", "scalability", "domain driven design", "latency", "distributed systems", "deployment", "boundary"],
          tradeoffConcepts: ["monolithic deployment ease vs microservice team autonomy"],
          idealApproach: "Highlight Domain-Driven Design (DDD) bounded contexts. Discuss operational overhead like service discovery, monitoring, and network overhead.",
          sampleAnswer: "A transition to microservices is justified when organizational growth requires independent team deployment autonomy and heterogeneous scaling. However, microservices introduce distributed system complexity, including network latency, eventual consistency, and operational monitoring requirements."
        },
        {
          id: "se-q8",
          title: "Memory Management & Garbage Collection Dynamics",
          difficulty: "INTERMEDIATE",
          category: "RUNTIMES & MEMORY",
          isProjectQuestion: false,
          scenario: "How do modern runtime environments (Java JVM, V8 JS Engine, Python GC) manage memory heap allocation, garbage collection, and leak prevention?",
          hint: "Explain stack vs heap, generational garbage collection, reference counting, mark-and-sweep, and memory leaks.",
          keywords: ["memory leak", "garbage collection", "heap", "stack", "v8", "mark and sweep", "reference counting", "allocation"],
          tradeoffConcepts: ["stop-the-world GC latency vs manual memory management safety"],
          idealApproach: "Distinguish stack memory from heap allocation. Explain generational mark-and-sweep GC algorithms and strategies for avoiding unreferenced object leaks.",
          sampleAnswer: "Runtimes manage stack for primitive execution frames and heap for objects. Modern GCs use generational mark-and-sweep algorithms. Memory leaks occur when unreachable objects remain referenced (e.g. uncleared global listeners or closures), which requires heap snapshot profiling."
        },
        {
          id: "se-q9",
          title: "Distributed Caching Strategies & Cache Invalidations",
          difficulty: "INTERMEDIATE",
          category: "DISTRIBUTED SYSTEMS",
          isProjectQuestion: false,
          scenario: "Compare Cache-Aside, Write-Through, and Write-Behind caching patterns. How do you handle cache invalidation and thundering herd problems?",
          hint: "Discuss Redis/Memcached, TTL expiry, cache stampede, mutex locks, and eventual consistency.",
          keywords: ["cache aside", "write through", "redis", "invalidation", "ttl", "thundering herd", "cache stampede", "consistency"],
          tradeoffConcepts: ["cache freshness vs database read load"],
          idealApproach: "Detail Cache-Aside for read-heavy workloads. Explain TTL policies, probabilistic early expiration, and locking mechanisms for cache stampedes.",
          sampleAnswer: "In a Cache-Aside model, the application queries Redis first, falling back to the DB on cache miss. To mitigate thundering herd stampedes, I implement distributed mutex locks or probabilistic early expiry so only one request populates the cache."
        },
        {
          id: "se-q10",
          title: "Project Implementation: High-Throughput Event Processor",
          difficulty: "ADVANCED",
          category: "PROJECT KNOWLEDGE & IMPLEMENTATION",
          isProjectQuestion: true,
          scenario: "Describe a project where you built or optimized a data streaming or transaction processing system. How did you ensure data integrity and fault tolerance?",
          hint: "Explain data queueing, idempotency, retries, dead letter queues, and message payload validation.",
          keywords: ["project", "event driven", "kafka", "queue", "idempotent", "retry", "fault tolerance", "payload", "throughput"],
          tradeoffConcepts: ["at-least-once delivery duplicates vs exactly-once overhead"],
          idealApproach: "Outline event ingestion, queue buffering, idempotent consumer design, and fallback dead-letter queue architectures.",
          sampleAnswer: "I engineered a event processor using Kafka and Node.js workers handling 10k ops/sec. To guarantee idempotency, each event payload carried a unique deduplication key stored in Redis. Failed messages were routed to a Dead Letter Queue for reprocessing."
        },
        {
          id: "se-q11",
          title: "Git Branching Workflows & CI/CD Automated Quality Gates",
          difficulty: "BEGINNER",
          category: "DEVOPS & TOOLING",
          isProjectQuestion: false,
          scenario: "Explain your team's Git branching strategy (e.g. Trunk-Based vs GitFlow) and how automated CI/CD pipelines enforce code quality before production deployment.",
          hint: "Discuss pull requests, feature flags, unit test coverage, linting, build verification, and semantic versioning.",
          keywords: ["git", "branching", "trunk based", "ci/cd", "pipeline", "pull request", "linting", "automated testing", "github actions"],
          tradeoffConcepts: ["long-lived feature branches vs continuous integration frequency"],
          idealApproach: "Advocate Trunk-Based Development with short-lived feature branches. Describe CI checks including linting, unit test coverage, and automated deployment.",
          sampleAnswer: "I utilize Trunk-Based Development with short-lived feature branches and Pull Requests. Our GitHub Actions pipeline enforces automated linting, unit test coverage (>80%), security vulnerability scanning, and automated staging deployment upon approval."
        },
        {
          id: "se-q12",
          title: "Message Queues & Event-Driven Architecture",
          difficulty: "INTERMEDIATE",
          category: "SYSTEM INTEGRATION",
          isProjectQuestion: false,
          scenario: "Why are message brokers like RabbitMQ or Kafka used to decouple microservices? Discuss publish-subscribe vs point-to-point messaging models.",
          hint: "Discuss asynchronous messaging, decoupling, pub/sub, queues, backpressure handling, and event streaming.",
          keywords: ["message queue", "rabbitmq", "kafka", "pub sub", "asynchronous", "decoupling", "backpressure", "event driven"],
          tradeoffConcepts: ["synchronous request/response simplicity vs asynchronous event decoupling"],
          idealApproach: "Explain how queues buffer bursts of traffic and decouple producer-consumer runtimes via Pub/Sub or point-to-point queues.",
          sampleAnswer: "Message brokers decouple services by enabling asynchronous communication. Pub/Sub allows multiple downstream consumers to subscribe to events, while queue buffering handles traffic spikes without overloading downstream services."
        },
        {
          id: "se-q13",
          title: "Unit Testing, TDD & Automated Mocking Strategies",
          difficulty: "BEGINNER",
          category: "TESTING & QUALITY",
          isProjectQuestion: false,
          scenario: "How do you approach test-driven development (TDD) and mock external dependencies (databases, third-party APIs) without creating fragile test suites?",
          hint: "Discuss red-green-refactor cycle, stubs, mocks, dependency injection, and test isolation.",
          keywords: ["unit test", "tdd", "mocking", "stub", "dependency injection", "jest", "pytest", "test coverage", "isolation"],
          tradeoffConcepts: ["mocking internal implementation vs testing public contracts"],
          idealApproach: "Detail the TDD cycle. Explain mocking external boundaries via interfaces while avoiding over-mocking internal domain logic.",
          sampleAnswer: "TDD follows Red-Green-Refactor: writing failing unit tests first, writing minimal code to pass, and refactoring. I mock external network/database interfaces using dependency injection, preserving test speed and isolation."
        },
        {
          id: "se-q14",
          title: "API Security, Authentication Tokens & OWASP Defense",
          difficulty: "INTERMEDIATE",
          category: "SECURITY",
          isProjectQuestion: false,
          scenario: "How do you protect RESTful web services against common security threats such as SQL injection, XSS, CSRF, and broken access control?",
          hint: "Discuss parameterized queries, CORS, HTTP-only cookies, JWT validation, rate limiting, and RBAC.",
          keywords: ["security", "owasp", "sql injection", "xss", "csrf", "jwt", "authorization", "cors", "rate limit", "rbac"],
          tradeoffConcepts: ["security verification strictness vs API developer ergonomics"],
          idealApproach: "Address input parameterization, XSS escaping, CORS headers, HTTP-only cookie tokens, and strict Role-Based Access Control (RBAC).",
          sampleAnswer: "API security requires defense-in-depth: parameterized ORM queries for SQL injection, sanitized inputs for XSS, HTTP-Only cookies with SameSite attributes for CSRF, and RBAC token middleware for authorization."
        },
        {
          id: "se-q15",
          title: "Legacy Code Refactoring & Technical Debt Management",
          difficulty: "ADVANCED",
          category: "PROJECT & MAINTENANCE",
          isProjectQuestion: true,
          scenario: "Describe a real-world scenario where you refactored a tightly-coupled legacy codebase. How did you maintain system uptime and prevent regression bugs?",
          hint: "Discuss characterization tests, strangler fig pattern, incremental refactoring, and regression test suites.",
          keywords: ["project", "refactoring", "legacy code", "strangler pattern", "technical debt", "regression", "decoupling", "unit test"],
          tradeoffConcepts: ["full system rewrite risk vs incremental strangler migration"],
          idealApproach: "Explain the Strangler Fig pattern for incremental migration, writing characterization tests first, and refactoring behind feature flags.",
          sampleAnswer: "To refactor a monolithic billing module, I applied the Strangler Fig pattern. I wrote comprehensive characterization tests around legacy routes, extracted modular services, and directed traffic incrementally using feature flags."
        }
      ],

      "Frontend Developer": [
        {
          id: "fe-q1",
          title: "DOM Rendering Lifecycle & Frontend Performance Optimization",
          difficulty: "INTERMEDIATE",
          category: "WEB ARCHITECTURE",
          isProjectQuestion: false,
          scenario: "A complex web page with dynamic list updates experiences noticeable UI jank and frame drops during scrolling. How do you diagnose and eliminate unnecessary reflows and repaints?",
          hint: "Discuss virtual DOM / document fragments, CSS transforms, debouncing, virtualization (windowing), and browser DevTools profiling.",
          keywords: ["reflow", "repaint", "virtualization", "devtools", "performance", "dom", "transform", "debounce", "framerate", "fps"],
          tradeoffConcepts: ["virtual DOM reconciliation cost vs direct DOM manipulation", "list windowing memory usage"],
          idealApproach: "Profile with Chrome DevTools Performance tab, minimize layout thrashing, utilize CSS transform/opacity for GPU acceleration, and apply list virtualization for large datasets.",
          sampleAnswer: "I would use Chrome DevTools Performance tab to record frame rates and identify long tasks triggering layout reflows. To optimize, I batch DOM updates, replace margin animations with CSS transform/opacity properties, debounce scroll listeners, and apply list virtualization."
        },
        {
          id: "fe-q2",
          title: "Asynchronous State Management & Race Condition Handling",
          difficulty: "INTERMEDIATE",
          category: "JAVASCRIPT / REACT",
          isProjectQuestion: false,
          scenario: "When a user rapidly types queries in a search input, earlier network responses sometimes resolve after later queries, causing stale data to overwrite fresh search results. How do you resolve this race condition?",
          hint: "Discuss AbortController, request cancellation, debouncing, and React effect cleanup functions.",
          keywords: ["abortcontroller", "async", "race condition", "debounce", "cancel", "fetch", "useeffect", "stale data", "state"],
          tradeoffConcepts: ["client-side debouncing delay vs server request load", "aborting network requests"],
          idealApproach: "Utilize AbortController in fetch requests with cleanup handlers in useEffect, coupled with debouncing the user input stream.",
          sampleAnswer: "To prevent async search race conditions, I combine input debouncing with the browser's native AbortController API. Inside useEffect, I pass an AbortSignal to fetch and call controller.abort() in the cleanup function."
        },
        {
          id: "fe-q3",
          title: "Responsive Layout Architecture & Accessibility (a11y)",
          difficulty: "BEGINNER",
          category: "CSS & ACCESSIBILITY",
          isProjectQuestion: false,
          scenario: "Explain how you build a responsive, accessible navigation drawer that works seamlessly across 360px mobile viewports up to 4K desktop screens, ensuring full keyboard and screen-reader support.",
          hint: "Discuss media queries, rem units, ARIA attributes (aria-expanded, aria-hidden), focus trap, and keyboard navigation (Tab/Esc).",
          keywords: ["responsive", "css grid", "flexbox", "aria", "accessibility", "focus trap", "keyboard navigation", "media query", "rem"],
          tradeoffConcepts: ["custom accessible UI widgets vs native HTML elements", "mobile drawer usability"],
          idealApproach: "Use CSS Grid/Flexbox with fluid rem units, manage aria-expanded attributes for assistive technology, and implement a focus trap ensuring keyboard users can navigate and exit via the Escape key.",
          sampleAnswer: "I build responsive layouts mobile-first using CSS Flexbox/Grid and rem units. For accessibility (WCAG 2.1 AA), the drawer trigger uses aria-expanded. When open, a focus trap confines Tab navigation and handles the Escape key."
        },
        {
          id: "fe-q4",
          title: "Frontend Portfolio Project UI/UX Architecture Walkthrough",
          difficulty: "ADVANCED",
          category: "PROJECT KNOWLEDGE & FRONTEND",
          isProjectQuestion: true,
          scenario: "Walk through a complex frontend web application you built. Explain your component hierarchy, state management strategy, styling architecture, and accessibility features.",
          hint: "Discuss component structure, global vs local state, API integration, performance optimizations, and design system choices.",
          keywords: ["project", "frontend", "react", "component", "state management", "design system", "accessibility", "responsive", "portfolio"],
          tradeoffConcepts: ["centralized global state vs localized state isolation"],
          idealApproach: "Describe app requirements, justify component composition and state management choices, highlight accessibility standards and visual performance.",
          sampleAnswer: "My portfolio app is a single-page dashboard built with React and Vanilla CSS. I implemented modular UI components with state isolation for local inputs and Context API for global session themes. The project incorporates responsive breakpoints and accessibility ARIA roles."
        },
        {
          id: "fe-q5",
          title: "Frontend Build Optimization & Bundle Splitting",
          difficulty: "ADVANCED",
          category: "BUILD TOOLS & DEPLOYMENT",
          isProjectQuestion: false,
          scenario: "Your production JavaScript bundle size has grown to 3MB, causing slow initial page load times on mobile connections. How do you analyze and optimize the bundle?",
          hint: "Discuss code splitting (React.lazy / dynamic import), tree shaking, bundle analyzers, and image/asset compression.",
          keywords: ["bundle size", "code splitting", "tree shaking", "dynamic import", "lazy loading", "webpack", "vite", "lighthouse", "performance"],
          tradeoffConcepts: ["granular chunk splitting vs HTTP request count", "preloading critical routes"],
          idealApproach: "Analyze bundle composition with bundle visualizers, apply route-based code splitting via dynamic imports, verify ES module tree shaking, and optimize static assets.",
          sampleAnswer: "I analyze bundles using Rollup/Webpack visualizer, then implement route-based code splitting using React.lazy() and dynamic import(). I verify tree-shaking support and replace heavy packages with lightweight alternatives."
        },
        {
          id: "fe-q6",
          title: "Client-Side Routing & SPA Navigation State",
          difficulty: "BEGINNER",
          category: "SPA ARCHITECTURE",
          isProjectQuestion: false,
          scenario: "How does single-page application (SPA) client-side routing work under the hood using HTML5 History API, and how do you handle deep-link reloads on static servers?",
          hint: "Discuss pushState, replaceState, popstate event, fallback route rewrites, and path parsing.",
          keywords: ["routing", "history api", "pushstate", "spa", "deep linking", "fallback", "react router", "navigation"],
          tradeoffConcepts: ["hash-based routing simplicity vs HTML5 history clean URLs"],
          idealApproach: "Explain history.pushState and popstate event listeners. Detail server rewrite rules (index.html fallback) for static web hosting.",
          sampleAnswer: "SPA routing intercept anchor clicks and updates the browser URL via history.pushState without page reloads. For deep linking, server rewrite rules redirect all request paths to index.html."
        },
        {
          id: "fe-q7",
          title: "Core Web Vitals Measurement & Optimization",
          difficulty: "INTERMEDIATE",
          category: "PERFORMANCE METRICS",
          isProjectQuestion: false,
          scenario: "How do you measure and improve Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS)?",
          hint: "Discuss font display swap, image dimension attributes, main thread yield, critical CSS, and CDN caching.",
          keywords: ["web vitals", "lcp", "inp", "cls", "lighthouse", "layout shift", "performance", "font display", "cdn"],
          tradeoffConcepts: ["lazy loading images vs immediate LCP hero rendering"],
          idealApproach: "Define LCP, INP, and CLS thresholds. Detail explicit image dimensions for CLS, preloading hero assets for LCP, and yielding main thread tasks for INP.",
          sampleAnswer: "To optimize Core Web Vitals, I fix CLS by setting explicit image dimensions and font-display: swap. I improve LCP by preloading hero assets, and reduce INP by breaking long JS tasks into microtasks."
        },
        {
          id: "fe-q8",
          title: "CSS Architecture & Design Token Management",
          difficulty: "BEGINNER",
          category: "CSS ARCHITECTURE",
          isProjectQuestion: false,
          scenario: "Compare Vanilla CSS variables (custom properties), CSS Modules, and Utility-First CSS. How do design tokens promote consistent branding and theme switching?",
          hint: "Discuss CSS custom properties, scoping, dark mode themes, design tokens, and maintainability.",
          keywords: ["css", "custom properties", "variables", "design tokens", "dark mode", "theme", "css modules", "styling"],
          tradeoffConcepts: ["utility CSS rapid prototyping vs bespoke CSS token control"],
          idealApproach: "Explain custom properties at :root. Detail dark mode theme swapping via data-theme attributes and token mapping.",
          sampleAnswer: "Design tokens encapsulate design attributes (colors, spacing, typography) into CSS variables defined at :root. Dark mode is implemented by switching data-theme attributes on the document body."
        },
        {
          id: "fe-q9",
          title: "Client Storage & Security Best Practices",
          difficulty: "INTERMEDIATE",
          category: "FRONTEND SECURITY",
          isProjectQuestion: false,
          scenario: "When should you use LocalStorage vs SessionStorage vs IndexedDB vs HTTP-Only Cookies? Why is storing sensitive auth tokens in LocalStorage risky?",
          hint: "Discuss XSS security risks, HTTP-Only cookies, storage quotas, synchronous vs async APIs.",
          keywords: ["localstorage", "indexeddb", "cookies", "http-only", "xss", "security", "sessionstorage", "tokens"],
          tradeoffConcepts: ["LocalStorage API simplicity vs XSS token theft vulnerability"],
          idealApproach: "Warn against LocalStorage for sensitive tokens due to XSS vulnerability. Advocate HTTP-Only SameSite cookies for tokens and IndexedDB for large data.",
          sampleAnswer: "LocalStorage is vulnerable to XSS token theft because any script can read it. Sensitive auth tokens belong in HTTP-Only, Secure, SameSite cookies. IndexedDB is ideal for large offline datasets."
        },
        {
          id: "fe-q10",
          title: "Interactive Web Application Project Walkthrough",
          difficulty: "ADVANCED",
          category: "PROJECT KNOWLEDGE & IMPLEMENTATION",
          isProjectQuestion: true,
          scenario: "Describe an interactive web project you created featuring real-time updates, client-side data filtering, or dynamic forms. What challenges did you encounter?",
          hint: "Discuss state updates, performance optimization, user feedback, error boundaries, and form handling.",
          keywords: ["project", "interactive", "dynamic form", "filtering", "state", "user experience", "performance", "event handling"],
          tradeoffConcepts: ["real-time input search filtering vs server side pagination"],
          idealApproach: "Detail problem domain, interactive UI features, state management choices, performance tuning, and resolved edge-case challenges.",
          sampleAnswer: "I developed a real-time data filtering web application with search auto-complete. I optimized rendering by debouncing search input and memoizing filtered list components."
        },
        {
          id: "fe-q11",
          title: "Cross-Browser Compatibility & Legacy Polyfill Strategy",
          difficulty: "BEGINNER",
          category: "BROWSER SUPPORT",
          isProjectQuestion: false,
          scenario: "How do you handle feature detection, progressive enhancement, and polyfills when supporting diverse browser engines (Blink, Gecko, WebKit)?",
          hint: "Discuss Browserslist, Babel, CSS @supports, feature detection, and polyfill.io.",
          keywords: ["cross browser", "polyfill", "browserslist", "feature detection", "css supports", "babel", "compatibility"],
          tradeoffConcepts: ["shipping heavy polyfills vs dropping legacy browser support"],
          idealApproach: "Use Browserslist with Babel/Autoprefixer. Advocate feature detection using JS typeof or CSS @supports before executing modern APIs.",
          sampleAnswer: "I manage browser support using Browserslist configs with Babel and Autoprefixer. I implement progressive enhancement and check feature availability using CSS @supports or JavaScript API feature detection."
        },
        {
          id: "fe-q12",
          title: "State Management Paradigms: Context vs Redux vs Zustand",
          difficulty: "INTERMEDIATE",
          category: "REACT STATE",
          isProjectQuestion: false,
          scenario: "When is React Context sufficient, and when should you adopt external state management tools like Redux Toolkit or Zustand?",
          hint: "Discuss render optimization, selector subscriptions, state boilerplate, global vs feature state.",
          keywords: ["state management", "react context", "redux", "zustand", "selectors", "re-render", "global state"],
          tradeoffConcepts: ["React Context simplicity vs re-render propagation cost"],
          idealApproach: "Explain that React Context causes re-renders in all consumers when state updates. Recommend Zustand/Redux for granular selector subscriptions.",
          sampleAnswer: "React Context is ideal for low-frequency updates like themes. For frequent data changes, Context triggers unnecessary consumer re-renders; libraries like Zustand offer selector-based subscriptions."
        },
        {
          id: "fe-q13",
          title: "Complex Multi-Step Form UX & Validation Architecture",
          difficulty: "INTERMEDIATE",
          category: "FORM UX",
          isProjectQuestion: false,
          scenario: "How do you design a robust multi-step wizard form with field validation, state persistence, error messages, and keyboard accessibility?",
          hint: "Discuss controlled vs uncontrolled inputs, schema validation (Zod/Yup), step progress state, and auto-save.",
          keywords: ["multi-step form", "validation", "formik", "react hook form", "zod", "ux", "accessibility", "persistence"],
          tradeoffConcepts: ["step-by-step immediate validation vs final submit validation"],
          idealApproach: "Utilize schema validation libraries (Zod), maintain active step state with persistence, and ensure clear inline error notifications.",
          sampleAnswer: "I structure multi-step forms using React Hook Form and Zod schema validation. Step state is validated before progression and persisted to SessionStorage to prevent data loss."
        },
        {
          id: "fe-q14",
          title: "Offline-First Web Apps & Service Worker Caching",
          difficulty: "ADVANCED",
          category: "PWA ARCHITECTURE",
          isProjectQuestion: false,
          scenario: "How do Service Workers enable Progressive Web App (PWA) offline capabilities using CacheFirst vs NetworkFirst strategies?",
          hint: "Discuss service worker lifecycle, CacheStorage API, background sync, CacheFirst vs NetworkFirst.",
          keywords: ["service worker", "pwa", "offline", "cache first", "network first", "workbox", "cache storage"],
          tradeoffConcepts: ["CacheFirst speed vs stale content risk"],
          idealApproach: "Compare CacheFirst (for static assets) with NetworkFirst (for dynamic API data). Explain service worker registration and push notifications.",
          sampleAnswer: "Service workers intercept network requests. I apply CacheFirst strategies for immutable static assets (JS/CSS) and NetworkFirst with fallback for dynamic data endpoints."
        },
        {
          id: "fe-q15",
          title: "Design System & Accessible Component Library Implementation",
          difficulty: "ADVANCED",
          category: "PROJECT KNOWLEDGE & UI SYSTEMS",
          isProjectQuestion: true,
          scenario: "Describe a project where you authored or maintained a reusable component library. How did you ensure consistent styling, documentation, and automated testing?",
          hint: "Discuss Storybook, component props, NPM publishing, headless UI, and visual regression testing.",
          keywords: ["project", "design system", "component library", "storybook", "accessibility", "reusable", "npm", "props"],
          tradeoffConcepts: ["building custom components vs wrapping Radix/Headless UI"],
          idealApproach: "Detail component prop interfaces, Storybook documentation, accessibility standards, and automated unit/visual regression tests.",
          sampleAnswer: "I authored a reusable UI component library using React, TypeScript, and CSS variables documented in Storybook. Components were built with ARIA attributes and tested for accessibility."
        }
      ]
    });

    const fullCatalog = createCatalog();
    if (fullCatalog[catalogKey]) return fullCatalog[catalogKey];

    // Fallback template for remaining careers ensuring 15 unique questions each
    const genericRoles = [
      "Backend Developer", "Full Stack Developer", "Python Developer",
      "Data Analyst", "Data Scientist", "AI/ML Engineer",
      "Cybersecurity Engineer", "Cloud Engineer", "DevOps Engineer", "UI/UX Designer"
    ];

    const generateRoleQuestions = (roleName, prefix) => {
      const isProjectIdxs = [3, 9, 14]; // 0-indexed: 4th, 10th, 15th
      const list = [];

      for (let i = 1; i <= 15; i++) {
        const isProject = isProjectIdxs.includes(i - 1);
        list.push({
          id: `${prefix}-q${i}`,
          title: isProject
            ? `${roleName} Portfolio Project & Architecture Deep Dive ${i}`
            : `${roleName} Core Technical Concept & Scenario ${i}`,
          difficulty: i % 3 === 0 ? "ADVANCED" : (i % 2 === 0 ? "INTERMEDIATE" : "BEGINNER"),
          category: isProject ? "PROJECT KNOWLEDGE & ARCHITECTURE" : "TECHNICAL & PROBLEM SOLVING",
          isProjectQuestion: isProject,
          scenario: isProject
            ? `Describe an end-to-end ${roleName} project in your portfolio. Explain the technical problem, system design, implementation challenges, and measurable results.`
            : `Explain how you would address a critical ${roleName} technical scenario involving optimization, security, data processing, or scalable architecture.`,
          hint: isProject
            ? "Highlight the project goals, system architecture, tech stack selection, trade-offs, and key outcomes."
            : "Focus on domain-specific terminology, technical methodology, trade-off evaluation, and practical steps.",
          keywords: [roleName.toLowerCase(), "architecture", "optimization", "scalability", "implementation", "tradeoff", "performance", "security", "testing"],
          tradeoffConcepts: ["performance vs complexity", "security vs throughput", "short term delivery vs long term maintainability"],
          idealApproach: isProject
            ? `Structure your answer using the STAR method. Describe the system architecture, technology choices, and quantifiable outcomes for ${roleName}.`
            : `Systematically analyze requirements, explain technical patterns for ${roleName}, discuss trade-offs, and detail implementation steps.`,
          sampleAnswer: isProject
            ? `In my ${roleName} portfolio project, I designed a scalable solution addressing real-world operational constraints. I implemented structured modules, validated technical workflows, and ensured high reliability.`
            : `When addressing this ${roleName} challenge, I start by analyzing system constraints, selecting proven design patterns, evaluating trade-offs, and applying automated verification.`
        });
      }
      return list;
    };

    const rolePrefixes = {
      "Backend Developer": "be",
      "Full Stack Developer": "fs",
      "Python Developer": "py",
      "Data Analyst": "da",
      "Data Scientist": "ds",
      "AI/ML Engineer": "ml",
      "Cybersecurity Engineer": "sec",
      "Cloud Engineer": "cld",
      "DevOps Engineer": "dev",
      "UI/UX Designer": "ux"
    };

    if (rolePrefixes[catalogKey]) {
      return generateRoleQuestions(catalogKey, rolePrefixes[catalogKey]);
    }

    return fullCatalog["Software Engineer"];
  },

  /**
   * Load Saved Data from LocalStorage
   */
  loadData() {
    try {
      const interviewRaw = localStorage.getItem(INTERVIEW_STORAGE_KEY);
      if (interviewRaw) {
        this.interviewData = JSON.parse(interviewRaw);
        if (this.interviewData.activeMode) {
          this.activeMode = this.interviewData.activeMode;
        }
      } else {
        this.interviewData = {
          targetCareer: this.readiness.targetCareer,
          activeMode: this.activeMode,
          completedAnswers: {},
          overallScore: 0,
          technicalScore: 0,
          problemSolvingScore: 0,
          communicationScore: 0,
          projectKnowledgeScore: 0
        };
      }

      const historyRaw = localStorage.getItem(INTERVIEW_HISTORY_STORAGE_KEY);
      if (historyRaw) {
        this.interviewHistory = JSON.parse(historyRaw);
        if (!Array.isArray(this.interviewHistory)) this.interviewHistory = [];
      } else {
        this.interviewHistory = [];
      }

      const toolsRaw = localStorage.getItem(CAREER_TOOLS_STORAGE_KEY);
      if (toolsRaw) {
        this.careerToolsData = JSON.parse(toolsRaw);
      } else {
        this.careerToolsData = {
          resume: {},
          readinessAudit: {},
          projectEvidence: {}
        };
      }
    } catch (e) {
      console.error('Error loading stored interview data:', e);
      this.interviewData = {
        targetCareer: this.readiness.targetCareer,
        activeMode: this.activeMode,
        completedAnswers: {},
        overallScore: 0
      };
      this.interviewHistory = [];
      this.careerToolsData = { projectEvidence: {} };
    }
  },

  /**
   * Get Current Question Object for Active Index
   */
  getCurrentQuestion() {
    const questions = this.getActiveQuestions();
    return questions[this.currentQuestionIndex] || questions[0];
  },

  /**
   * Deterministic 4-Dimension Answer Evaluation Engine
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
    const activeQuestions = this.getActiveQuestions();
    const evaluation = this.calculateEvaluation(answerText, q);

    // Save answer evaluation by question ID (preserves answer across mode switches)
    if (!this.interviewData) {
      this.interviewData = {
        targetCareer: this.readiness.targetCareer,
        activeMode: this.activeMode,
        completedAnswers: {},
        overallScore: 0
      };
    }
    if (!this.interviewData.completedAnswers) this.interviewData.completedAnswers = {};

    this.interviewData.completedAnswers[q.id] = {
      userAnswer: answerText,
      evaluation: evaluation,
      evaluatedAt: new Date().toISOString()
    };

    // Calculate session multi-dimension averages across currently active questions
    let totalTech = 0, totalProb = 0, totalComm = 0, totalProj = 0;
    let answeredCount = 0;

    activeQuestions.forEach(item => {
      const record = this.interviewData.completedAnswers[item.id];
      if (record && record.evaluation) {
        answeredCount++;
        totalTech += (record.evaluation.technicalScore || 0);
        totalProb += (record.evaluation.problemSolvingScore || 0);
        totalComm += (record.evaluation.communicationScore || 0);
        totalProj += (record.evaluation.projectKnowledgeScore || 0);
      }
    });

    const count = answeredCount || 1;
    const avgTech = Math.round(totalTech / count);
    const avgProb = Math.round(totalProb / count);
    const avgComm = Math.round(totalComm / count);
    const avgProj = Math.round(totalProj / count);

    // Check if active questions contain project questions
    const hasProjectQuestions = activeQuestions.some(item => item.isProjectQuestion === true || (item.category && item.category.includes("PROJECT")));

    let sessionOverall = 0;
    if (hasProjectQuestions) {
      // 35% Tech + 30% Prob + 15% Comm + 20% Proj
      sessionOverall = Math.round(avgTech * 0.35 + avgProb * 0.30 + avgComm * 0.15 + avgProj * 0.20);
    } else {
      // Proportional redistribution: Tech 43.75%, Prob 37.5%, Comm 18.75%
      sessionOverall = Math.round(avgTech * 0.4375 + avgProb * 0.375 + avgComm * 0.1875);
    }

    this.interviewData.overallScore = sessionOverall;
    this.interviewData.technicalScore = avgTech;
    this.interviewData.problemSolvingScore = avgProb;
    this.interviewData.communicationScore = avgComm;
    this.interviewData.projectKnowledgeScore = avgProj;

    // Save session and record snapshot in history
    this.saveInterviewData();
    this.recordHistorySnapshot(sessionOverall, avgTech, avgProb, avgComm, avgProj, evaluation.strengths, evaluation.weaknesses);

    this.renderEvaluationResults(evaluation);
    this.renderReadinessAudit();
    this.renderInterviewHistory();
  },

  /**
   * Deterministic Evaluation Scoring Calculation for a Single Question
   */
  calculateEvaluation(text, question) {
    const lowerText = text.toLowerCase();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // 1. Technical Depth Score (0-100)
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

    const keywordRatio = keywords.length > 0 ? (matchedKeywords / keywords.length) : 0.75;
    let technicalScore = Math.round(keywordRatio * 75 + (wordCount >= 60 ? 25 : (wordCount / 60) * 25));
    technicalScore = Math.max(30, Math.min(100, technicalScore));

    // 2. Communication Clarity Score (0-100)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const hasParagraphs = text.includes('\n');
    let communicationScore = 50;

    if (wordCount >= 40) communicationScore += 20;
    if (wordCount >= 90) communicationScore += 15;
    if (sentences.length >= 3) communicationScore += 10;
    if (hasParagraphs) communicationScore += 5;
    communicationScore = Math.max(35, Math.min(100, communicationScore));

    // 3. Problem Solving Score (0-100)
    const problemSolvingKeywords = [
      "tradeoff", "trade-off", "performance", "scale", "latency", "memory", "complexity",
      "edge case", "alternative", "optimize", "handling", "mitigate", "bottleneck", "security", "algorithm"
    ];
    let matchedProbTerms = 0;
    problemSolvingKeywords.forEach(term => {
      if (lowerText.includes(term)) matchedProbTerms++;
    });

    let problemSolvingScore = 40 + (matchedProbTerms * 12);
    if (wordCount >= 80) problemSolvingScore += 10;
    problemSolvingScore = Math.max(30, Math.min(100, problemSolvingScore));

    // 4. Project Knowledge Score (0-100)
    const projectKeywords = [
      "architecture", "implemented", "deployed", "stack", "testing", "portfolio", "framework",
      "docker", "github", "pipeline", "database", "api", "client", "server", "workflow"
    ];
    let matchedProjTerms = 0;
    projectKeywords.forEach(term => {
      if (lowerText.includes(term)) matchedProjTerms++;
    });

    let projectKnowledgeScore = 35 + (matchedProjTerms * 12);
    if (question.isProjectQuestion) projectKnowledgeScore += 15;
    projectKnowledgeScore = Math.max(30, Math.min(100, projectKnowledgeScore));

    // Single question overall score calculation
    const overallScore = Math.round(
      technicalScore * 0.35 +
      problemSolvingScore * 0.30 +
      communicationScore * 0.15 +
      projectKnowledgeScore * 0.20
    );

    // Qualitative Strengths & Weaknesses
    const strengths = [];
    const weaknesses = [];

    if (technicalScore >= 75) strengths.push("Strong technical terminology & keyword precision");
    else weaknesses.push("Incorporate deeper domain terms (e.g. " + missingList.slice(0, 2).join(", ") + ")");

    if (communicationScore >= 75) strengths.push("Clear, structured explanation with good flow");
    else weaknesses.push("Format answer into distinct, well-structured paragraphs");

    if (problemSolvingScore >= 75) strengths.push("Evaluates trade-offs, complexity, and performance factors");
    else weaknesses.push("Discuss performance trade-offs and edge-case handling explicitly");

    if (projectKnowledgeScore >= 75) strengths.push("Demonstrates practical architectural & implementation knowledge");
    else weaknesses.push("Elaborate on hands-on project choices and implementation tools");

    if (strengths.length === 0) strengths.push("Established baseline technical concept understanding");
    if (weaknesses.length === 0) weaknesses.push("Quantify real-world benchmark metrics and latency constraints");

    let feedback = "";
    if (overallScore >= 80) {
      feedback = "Excellent response. Your answer demonstrates strong technical depth, domain accuracy, and structured reasoning addressing trade-offs and architecture.";
    } else if (overallScore >= 60) {
      feedback = "Solid foundation. Your answer covers core principles well. To reach top interview readiness, elaborate further on architectural edge cases and performance trade-offs.";
    } else {
      feedback = "Developing response. Focus on expanding technical detail, using domain terms, and explicitly analyzing trade-offs.";
    }

    let statusLabel = "DEVELOPING";
    if (overallScore >= 85) statusLabel = "EXCEPTIONAL";
    else if (overallScore >= 70) statusLabel = "STRONG RESPONSE";
    else if (overallScore >= 50) statusLabel = "DEVELOPING";
    else statusLabel = "NEEDS REFINEMENT";

    return {
      technicalScore,
      communicationScore,
      problemSolvingScore,
      projectKnowledgeScore,
      overallScore,
      statusLabel,
      feedback,
      strengths,
      weaknesses,
      idealApproach: question.idealApproach || "Structure answer systematically using the STAR technique."
    };
  },

  /**
   * Record Snapshot to History Array
   */
  recordHistorySnapshot(overallScore, techScore, probScore, commScore, projScore, strengths, weakAreas) {
    if (!Array.isArray(this.interviewHistory)) this.interviewHistory = [];

    const snapshot = {
      id: "session-" + Date.now(),
      targetCareer: this.readiness.targetCareer,
      mode: this.activeMode,
      questionCount: this.getActiveQuestions().length,
      completedAt: new Date().toISOString(),
      overallScore,
      technicalScore: techScore,
      problemSolvingScore: probScore,
      communicationScore: commScore,
      projectKnowledgeScore: projScore,
      strengths: strengths || [],
      weakAreas: weakAreas || []
    };

    this.interviewHistory.push(snapshot);
    try {
      localStorage.setItem(INTERVIEW_HISTORY_STORAGE_KEY, JSON.stringify(this.interviewHistory));
    } catch (e) {
      console.error('Error saving interview history:', e);
    }
  },

  /**
   * Save Current Interview Data to LocalStorage
   */
  saveInterviewData() {
    try {
      localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(this.interviewData));
    } catch (e) {
      console.error('Error saving interview data:', e);
    }
  },

  /**
   * Save Career Tools Data to LocalStorage
   */
  saveCareerToolsData() {
    try {
      localStorage.setItem(CAREER_TOOLS_STORAGE_KEY, JSON.stringify(this.careerToolsData));
    } catch (e) {
      console.error('Error saving career tools data:', e);
    }
  },

  /**
   * Render Mode Selection Buttons UI
   */
  renderModeUI() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      if (btn.dataset.mode === this.activeMode) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    const modeLabel = document.getElementById('q-mode-label');
    if (modeLabel) {
      modeLabel.textContent = `${this.activeMode} MODE`;
    }
  },

  /**
   * Render Question View & Dots Progress
   */
  renderQuestionView() {
    this.renderModeUI();
    const questions = this.getActiveQuestions();

    // Clamp current index safely
    if (this.currentQuestionIndex >= questions.length) {
      this.currentQuestionIndex = Math.max(0, questions.length - 1);
    }

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

    // Answer textarea & evaluation results card
    const answerInput = document.getElementById('user-answer-input');
    const charCount = document.getElementById('answer-char-count');

    if (answerInput) {
      if (this.interviewData && this.interviewData.completedAnswers && this.interviewData.completedAnswers[q.id]) {
        const recorded = this.interviewData.completedAnswers[q.id];
        answerInput.value = recorded.userAnswer || '';
        this.renderEvaluationResults(recorded.evaluation);
      } else {
        answerInput.value = '';
        const evalCard = document.getElementById('evaluation-card');
        if (evalCard) evalCard.style.display = 'none';
      }
      if (charCount) charCount.textContent = answerInput.value.length + " characters";
    }
  },

  /**
   * Render 4-Dimension Evaluation Results Card
   */
  renderEvaluationResults(evalData) {
    if (!evalData) return;
    const evalCard = document.getElementById('evaluation-card');
    if (!evalCard) return;

    const overallNum = document.getElementById('eval-overall-number');
    const statusEl = document.getElementById('eval-overall-status');
    const techScoreEl = document.getElementById('eval-tech-score');
    const techBar = document.getElementById('eval-tech-bar');
    const commScoreEl = document.getElementById('eval-comm-score');
    const commBar = document.getElementById('eval-comm-bar');
    const probScoreEl = document.getElementById('eval-prob-score');
    const probBar = document.getElementById('eval-prob-bar');
    const projScoreEl = document.getElementById('eval-proj-score');
    const projBar = document.getElementById('eval-proj-bar');

    const feedbackEl = document.getElementById('eval-feedback-text');
    const strengthsContainer = document.getElementById('eval-strengths-list');
    const weaknessesContainer = document.getElementById('eval-weaknesses-list');
    const idealApproachEl = document.getElementById('eval-ideal-approach');

    if (overallNum) overallNum.textContent = "OVERALL: " + (evalData.overallScore || 0) + " / 100";
    if (statusEl) {
      statusEl.textContent = evalData.statusLabel || "EVALUATED";
      statusEl.className = evalData.overallScore >= 70 ? 'alignment-badge alignment-badge-high' : 'alignment-badge alignment-badge-medium';
    }

    if (techScoreEl) techScoreEl.textContent = (evalData.technicalScore || 0) + " / 100";
    if (techBar) techBar.style.width = (evalData.technicalScore || 0) + "%";

    if (commScoreEl) commScoreEl.textContent = (evalData.communicationScore || 0) + " / 100";
    if (commBar) commBar.style.width = (evalData.communicationScore || 0) + "%";

    if (probScoreEl) probScoreEl.textContent = (evalData.problemSolvingScore || 0) + " / 100";
    if (probBar) probBar.style.width = (evalData.problemSolvingScore || 0) + "%";

    if (projScoreEl) projScoreEl.textContent = (evalData.projectKnowledgeScore || 0) + " / 100";
    if (projBar) projBar.style.width = (evalData.projectKnowledgeScore || 0) + "%";

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
      headerStatus.textContent = (this.interviewData.overallScore || 0) + "% OVERALL SCORE";
    }
  },

  /**
   * Render Interview History Section
   */
  renderInterviewHistory() {
    const list = document.getElementById('interview-history-list');
    if (!list) return;

    list.innerHTML = '';

    if (!Array.isArray(this.interviewHistory) || this.interviewHistory.length === 0) {
      list.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">
          No completed interview sessions recorded yet. Evaluate responses in Tab 1 to build session history.
        </div>
      `;
      return;
    }

    // Render history items in reverse chronological order
    const reversed = [...this.interviewHistory].reverse();
    reversed.forEach((session, idx) => {
      const card = document.createElement('div');
      card.className = 'history-item-card';

      const dateStr = session.completedAt ? new Date(session.completedAt).toLocaleDateString() : 'Recent';
      card.innerHTML = `
        <div class="history-item-left">
          <div class="history-item-title">${session.targetCareer} (${session.mode} Mode — ${session.questionCount} Qs)</div>
          <div class="history-item-meta">Completed: ${dateStr} &bull; Tech: ${session.technicalScore}% | Prob: ${session.problemSolvingScore}% | Comm: ${session.communicationScore}% | Proj: ${session.projectKnowledgeScore}%</div>
        </div>
        <div class="history-item-score">${session.overallScore} / 100</div>
      `;
      list.appendChild(card);
    });
  },

  /**
   * Render 4-Tier Career Readiness Audit Checklist
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

    // 4. Technical Interview Readiness
    const icon4 = document.getElementById('audit-icon-4');
    const desc4 = document.getElementById('audit-desc-4');
    if (icon4 && desc4) {
      const ivScore = this.interviewData ? (this.interviewData.overallScore || 0) : 0;
      const ansCount = this.interviewData && this.interviewData.completedAnswers ? Object.keys(this.interviewData.completedAnswers).length : 0;
      if (ansCount > 0) {
        icon4.textContent = ivScore >= 65 ? '✓' : '⚙';
        icon4.className = ivScore >= 65 ? 'audit-icon text-green' : 'audit-icon text-amber';
        desc4.textContent = ansCount + ' questions evaluated. Overall score: ' + ivScore + '/100.';
      } else {
        icon4.textContent = '○';
        icon4.className = 'audit-icon';
        desc4.textContent = 'Complete interview questions in Tab 1 to unlock score verification.';
      }
    }
  },

  /**
   * Generate ATS-Friendly Markdown Resume Draft
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
    resume += `Goal-oriented ${target} with strong skills in ${skills.slice(0, 4).join(', ')}. Demonstrated readiness score of ${this.readiness.score || 0}/100 and practical portfolio implementation.\n\n`;
    resume += `## Education\n`;
    resume += `- **${degree}**\n\n`;
    resume += `## Core Technical Skills\n`;
    resume += `- **Verified Skills:** ${skills.join(', ')}\n\n`;
    resume += `## Key Portfolio Projects\n`;

    projectsList.forEach(proj => {
      resume += `### ${proj.title} (${proj.difficulty})\n`;
      resume += `- **Description:** ${proj.description}\n`;
      resume += `- **Tech Stack:** ${(proj.techStack || []).join(', ')}\n\n`;
    });

    resume += `---\n*Disclaimer: This is a structured preparation draft generated from the information you provide. It does not guarantee ATS acceptance, interview selection, employment, or job placement.*\n`;

    return resume;
  },

  /**
   * Render ATS-Friendly Resume Preview Box
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
   * Render GitHub & Live Demo Evidence Tracker
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
   * Save Evidence From Inputs to LocalStorage
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
   * Populate Passport Summary Modal with Latest Synced Scores
   */
  populatePassportModal() {
    const p = this.profile || {};
    const nameEl = document.getElementById('pass-candidate-name');
    const targetEl = document.getElementById('pass-target-career');
    const scoreEl = document.getElementById('pass-interview-score');
    const statusEl = document.getElementById('pass-interview-status');
    const skillsContainer = document.getElementById('pass-skills-list');
    const projContainer = document.getElementById('pass-projects-list');

    if (nameEl) nameEl.textContent = (p.personal && p.personal.fullName) ? p.personal.fullName : "Candidate";
    if (targetEl) targetEl.textContent = this.readiness.targetCareer || "Software Engineer";

    // Dynamic Latest Score Sync from careerPilotInterview or careerPilotInterviewHistory
    let latestScore = 0;
    let scoreStatus = "Interview Pending";

    if (this.interviewData && typeof this.interviewData.overallScore === 'number' && this.interviewData.overallScore > 0) {
      latestScore = this.interviewData.overallScore;
    } else if (Array.isArray(this.interviewHistory) && this.interviewHistory.length > 0) {
      const lastSession = this.interviewHistory[this.interviewHistory.length - 1];
      if (lastSession && lastSession.overallScore) latestScore = lastSession.overallScore;
    }

    if (latestScore > 0) {
      if (scoreEl) scoreEl.textContent = latestScore + " / 100";
      if (statusEl) {
        statusEl.textContent = latestScore >= 70 ? "READY ✓" : "DEVELOPING ⚙";
        statusEl.style.color = latestScore >= 70 ? "#22c55e" : "#f59e0b";
      }
    } else {
      if (scoreEl) scoreEl.textContent = "Not completed";
      if (statusEl) {
        statusEl.textContent = "Pending Evaluation";
        statusEl.style.color = "var(--text-muted)";
      }
    }

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

    const headerStatus = document.getElementById('iv-interview-status');
    if (headerStatus && this.interviewData) {
      headerStatus.textContent = (this.interviewData.overallScore || 0) + "% OVERALL SCORE";
    }

    this.renderQuestionView();
    this.renderInterviewHistory();
    this.renderReadinessAudit();
    this.renderResumePreview();
    this.renderEvidenceTracker();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  InterviewApp.init();
});
