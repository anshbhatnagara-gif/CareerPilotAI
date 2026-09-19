const pool = require('../src/config/db');
const config = require('../src/config/env');

const softwareEngineerQuestions = [
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
];

const frontendDeveloperQuestions = [
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
];

const genericRoles = [
  { name: "Backend Developer", prefix: "be" },
  { name: "Full Stack Developer", prefix: "fs" },
  { name: "Python Developer", prefix: "py" },
  { name: "Data Analyst", prefix: "da" },
  { name: "Data Scientist", prefix: "ds" },
  { name: "AI/ML Engineer", prefix: "ml" },
  { name: "Cybersecurity Engineer", prefix: "sec" },
  { name: "Cloud Engineer", prefix: "cld" },
  { name: "DevOps Engineer", prefix: "dev" },
  { name: "UI/UX Designer", prefix: "ux" }
];

function generateRoleQuestions(roleName, prefix) {
  const isProjectIdxs = [3, 9, 14]; // 0-indexed: 4th, 10th, 15th questions
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
}

// Build complete 180-question catalog map
const careerQuestionCatalog = {
  "Software Engineer": softwareEngineerQuestions,
  "Frontend Developer": frontendDeveloperQuestions
};

genericRoles.forEach(role => {
  careerQuestionCatalog[role.name] = generateRoleQuestions(role.name, role.prefix);
});

async function seedInterviewQuestions() {
  if (!config.TIDB_HOST || config.TIDB_HOST.trim() === '') {
    console.log('ℹ TIDB_HOST is unconfigured. Skipping live DB seed for interview questions.');
    return { success: true, count: 180, seeded: false };
  }

  let totalSeeded = 0;
  try {
    for (const [careerName, questions] of Object.entries(careerQuestionCatalog)) {
      for (const q of questions) {
        const expectedTopicsJson = JSON.stringify({
          keywords: q.keywords || [],
          tradeoffConcepts: q.tradeoffConcepts || [],
          idealApproach: q.idealApproach || "",
          hint: q.hint || "",
          sampleAnswer: q.sampleAnswer || ""
        });

        await pool.query(
          `INSERT INTO interview_questions 
            (question_key, target_career, category, difficulty, question_text, expected_topics, is_project_question)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            target_career = VALUES(target_career),
            category = VALUES(category),
            difficulty = VALUES(difficulty),
            question_text = VALUES(question_text),
            expected_topics = VALUES(expected_topics),
            is_project_question = VALUES(is_project_question)`,
          [
            q.id,
            careerName,
            q.category,
            q.difficulty,
            q.scenario || q.title,
            expectedTopicsJson,
            q.isProjectQuestion ? 1 : 0
          ]
        );
        totalSeeded++;
      }
    }
    console.log(`✅ Idempotently seeded ${totalSeeded} interview questions across 12 careers into TiDB Cloud.`);
    return { success: true, count: totalSeeded, seeded: true };
  } catch (error) {
    console.error('❌ Error seeding interview questions:', error);
    throw error;
  }
}

if (require.main === module) {
  seedInterviewQuestions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedInterviewQuestions, careerQuestionCatalog };
