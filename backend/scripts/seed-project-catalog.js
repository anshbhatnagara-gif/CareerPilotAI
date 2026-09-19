const pool = require('../src/config/db');
const config = require('../src/config/env');

const careerProjectCatalog = {
  "Software Engineer": [
    {
      id: "se-proj-1",
      title: "Console Task & File Management Utility",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A robust command-line application that manages tasks, parses custom input commands, and persists data to structured local files.",
      objective: "Demonstrate fundamental programming syntax, file I/O operations, modular functions, and algorithmic error handling.",
      skillsCovered: ["Programming", "Problem Solving", "File Handling"],
      requiredSkills: ["Programming"],
      techStack: ["Python / C++ / Java", "File I/O", "CLI"],
      estimatedEffort: "3–5 hours",
      milestones: [
        "Design CLI interface and command parsing loop",
        "Implement task CRUD operations in memory",
        "Add file persistence and JSON/text serialization",
        "Write input validation and exception handlers"
      ]
    },
    {
      id: "se-proj-2",
      title: "Student Academic Management System",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "An object-oriented database application to record student profiles, course enrollments, grade calculations, and GPA reporting.",
      objective: "Master object-oriented design principles (OOP), class hierarchies, and structured database queries.",
      skillsCovered: ["Programming", "OOP", "Database Fundamentals"],
      requiredSkills: ["Programming", "OOP"],
      techStack: ["Python / Java", "SQLite", "OOP Design"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Model Student, Course, and Grade classes",
        "Create relational database schema in SQLite",
        "Implement business logic for GPA and grading curves",
        "Build search, sorting, and academic report generation"
      ]
    },
    {
      id: "se-proj-3",
      title: "High-Efficiency Expense Tracker with Custom DSA",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A financial tracking engine that models transaction history, category trees, and quick financial query aggregations using custom data structures.",
      objective: "Apply core data structures (hash maps, trees, heaps) to achieve optimized search, indexing, and categorization speeds.",
      skillsCovered: ["Data Structures & Algorithms", "Programming", "Problem Solving"],
      requiredSkills: ["Programming", "Data Structures & Algorithms"],
      techStack: ["Python / Java / C++", "Custom DSA", "Algorithm Optimization"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Implement custom tree structure for spending categories",
        "Use min/max heap for highest expense tracking",
        "Optimize transaction lookup using custom hash map",
        "Benchmark performance with 10,000+ mock records"
      ]
    },
    {
      id: "se-proj-4",
      title: "Modular REST API Backend Service",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A structured REST API supporting CRUD endpoints, request validation, middleware logging, and database transactions.",
      objective: "Build a production-ready HTTP server backend following RESTful design conventions and clean architecture.",
      skillsCovered: ["Backend Fundamentals", "APIs", "Database Fundamentals", "Git"],
      requiredSkills: ["Programming", "APIs"],
      techStack: ["Node.js / Express / FastAPI", "SQL / SQLite", "REST API", "Postman"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Configure HTTP router and RESTful endpoint hierarchy",
        "Create database schema and query abstraction layer",
        "Implement request validation and custom error middleware",
        "Document API specifications with Swagger / Postman"
      ]
    },
    {
      id: "se-proj-5",
      title: "Token-Based Authentication & Authorization Microservice",
      difficulty: "INTERMEDIATE",
      priority: "MEDIUM",
      description: "A dedicated authentication server handling password hashing, JWT token issuance, session refresh, and role-based permissions.",
      objective: "Implement secure identity management and understand cryptographic password security best practices.",
      skillsCovered: ["Authentication", "APIs", "Security Fundamentals"],
      requiredSkills: ["Backend Fundamentals", "APIs"],
      techStack: ["Node.js / Python", "JWT", "Bcrypt", "REST API"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Implement salted bcrypt password hashing on registration",
        "Issue short-lived JWT access tokens and secure refresh tokens",
        "Build role-based authorization middleware (Admin vs User)",
        "Test security against injection and replay attacks"
      ]
    },
    {
      id: "se-proj-6",
      title: "Distributed Order Processing Backend Engine",
      difficulty: "ADVANCED",
      priority: "MEDIUM",
      description: "An asynchronous order processing system that manages inventory locks, order state machines, and payment reconciliation.",
      objective: "Master complex backend architecture, concurrent transactions, and multi-entity database consistency.",
      skillsCovered: ["Software Architecture", "APIs", "Database Fundamentals", "Backend Fundamentals"],
      requiredSkills: ["Backend Fundamentals", "APIs", "Data Structures & Algorithms"],
      techStack: ["FastAPI / Node.js", "PostgreSQL", "Async Workers", "Docker"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Model multi-table transactional database schema with locks",
        "Implement order state machine (Pending -> Paid -> Dispatched)",
        "Add background worker queue for notification processing",
        "Write comprehensive automated unit and integration tests"
      ]
    },
    {
      id: "se-proj-7",
      title: "Production-Grade Scalable Distributed System",
      difficulty: "ADVANCED",
      priority: "LOW",
      description: "A complete distributed software system featuring caching layers, load balancing, health monitoring, and CI/CD automated deployment.",
      objective: "Synthesize software design patterns, caching, database indexing, and deployment pipelines for career readiness.",
      skillsCovered: ["Software Architecture", "Testing", "Deployment", "Git", "GitHub"],
      requiredSkills: ["Software Architecture", "APIs", "Database Fundamentals"],
      techStack: ["Docker", "Redis", "PostgreSQL", "GitHub Actions"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Implement Redis caching layer for high-throughput reads",
        "Containerize services using Docker Compose",
        "Set up automated CI/CD pipeline with GitHub Actions",
        "Conduct load tests and generate architecture case study"
      ]
    }
  ],

  "Frontend Developer": [
    {
      id: "fe-proj-1",
      title: "Responsive Developer Portfolio Website",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A modern, accessible, mobile-first personal portfolio showcasing projects, technical skills, and contact channels.",
      objective: "Master semantic HTML5 markup, CSS3 Flexbox/Grid layouts, and responsive media queries across all device screen sizes.",
      skillsCovered: ["HTML", "CSS", "Responsive Design"],
      requiredSkills: ["HTML", "CSS"],
      techStack: ["HTML5", "CSS3", "Responsive Design", "Flexbox/Grid"],
      estimatedEffort: "3–5 hours",
      milestones: [
        "Draft wireframe and semantic HTML5 document structure",
        "Apply modern CSS styling, custom color variables, and typography",
        "Implement responsive navigation and media queries for mobile/tablet",
        "Deploy to GitHub Pages with clean cross-browser compatibility"
      ]
    },
    {
      id: "fe-proj-2",
      title: "High-Conversion SaaS Product Landing Page",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A pixel-perfect, interactive marketing landing page featuring hero banners, feature grids, pricing toggles, and testimonial sliders.",
      objective: "Develop proficiency with advanced CSS layout techniques, micro-animations, and interactive DOM UI components.",
      skillsCovered: ["HTML", "CSS", "JavaScript", "Responsive Design"],
      requiredSkills: ["HTML", "CSS"],
      techStack: ["HTML5", "CSS3", "Vanilla JavaScript", "CSS Animations"],
      estimatedEffort: "3–5 hours",
      milestones: [
        "Build layout with CSS Grid and flexbox alignment",
        "Add JavaScript interactive pricing toggle and accordion FAQs",
        "Create smooth scroll animations and hover micro-interactions",
        "Verify Lighthouse accessibility score of 95+"
      ]
    },
    {
      id: "fe-proj-3",
      title: "Live Interactive Weather Forecast Dashboard",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A dynamic weather dashboard fetching real-time meteorological data via third-party REST APIs with search, unit toggle, and geolocation.",
      objective: "Gain hands-on expertise with asynchronous JavaScript (Fetch/Async/Await), JSON parsing, and dynamic UI state rendering.",
      skillsCovered: ["JavaScript", "APIs", "HTML", "CSS"],
      requiredSkills: ["JavaScript", "HTML", "CSS"],
      techStack: ["Vanilla JavaScript", "REST API", "Fetch API", "CSS3"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Set up OpenWeatherMap API connection and async fetch handlers",
        "Implement city search with debouncing and geolocation fallback",
        "Render current temperature, 5-day forecast cards, and weather icons",
        "Handle network failure states, loading spinners, and invalid queries"
      ]
    },
    {
      id: "fe-proj-4",
      title: "Interactive Personal Budget & Expense Tracker UI",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A client-side finance tracker with interactive category filtering, local storage persistence, and dynamic financial charts.",
      objective: "Master complex DOM manipulation, state management in JavaScript, and client-side data persistence.",
      skillsCovered: ["JavaScript", "Responsive Design", "Git", "GitHub"],
      requiredSkills: ["JavaScript", "HTML", "CSS"],
      techStack: ["JavaScript (ES6+)", "LocalStorage", "Chart.js", "CSS3"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Build transaction entry form with validation and category tagging",
        "Implement LocalStorage sync for persistent browser sessions",
        "Integrate dynamic pie/bar charts summarizing expense breakdown",
        "Add category filters and date sorting controls"
      ]
    },
    {
      id: "fe-proj-5",
      title: "React Movie Discovery & Watchlist Web App",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A component-driven single page application built with React, consuming the TMDB API to search movies, view trailers, and manage watchlists.",
      objective: "Master React component lifecycles, hooks (useState, useEffect, useMemo), props drilling, and modular CSS.",
      skillsCovered: ["React", "APIs", "JavaScript", "Responsive Design"],
      requiredSkills: ["JavaScript", "React"],
      techStack: ["React", "React Hooks", "TMDB API", "CSS Modules"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Deconstruct UI into modular components (Card, SearchBar, Modal)",
        "Manage search state and async API calls with custom hooks",
        "Implement persistent personal Watchlist using browser storage",
        "Add animated modal overlays displaying movie trailers and cast"
      ]
    },
    {
      id: "fe-proj-6",
      title: "React Task & Sprint Board with Global State",
      difficulty: "INTERMEDIATE",
      priority: "MEDIUM",
      description: "A Kanban-style task management board with drag-and-drop column sorting, priority tags, and centralized state architecture.",
      objective: "Deepen understanding of React state patterns (Context API / Reducer) and complex UI interactions.",
      skillsCovered: ["React", "State Management", "JavaScript"],
      requiredSkills: ["React", "JavaScript"],
      techStack: ["React", "Context API", "useReducer", "Drag & Drop API"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Set up centralized state management with useReducer and Context",
        "Build Kanban column workflow (Backlog -> In Progress -> Done)",
        "Implement drag-and-drop item reordering and column transfers",
        "Add task filtering by assignee, label, and priority"
      ]
    },
    {
      id: "fe-proj-7",
      title: "Full-Featured E-Commerce Storefront with Cart & Checkout",
      difficulty: "ADVANCED",
      priority: "MEDIUM",
      description: "A production-level online shopping experience with product catalog, multi-facet filtering, shopping cart drawer, and checkout validation.",
      objective: "Build an industry-standard frontend e-commerce application handling complex UI states and checkout workflows.",
      skillsCovered: ["React", "APIs", "State Management", "Portfolio Preparedness"],
      requiredSkills: ["React", "APIs", "State Management"],
      techStack: ["React", "React Router", "REST API", "Tailwind / CSS Modules"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Implement multi-route architecture with React Router (Catalog, Product, Cart)",
        "Build persistent shopping cart drawer with quantity updates and tax math",
        "Create multi-facet filter bar (price range, categories, star ratings)",
        "Implement checkout form validation with credit card mask"
      ]
    },
    {
      id: "fe-proj-8",
      title: "Enterprise SaaS Analytics & Monitoring Dashboard",
      difficulty: "ADVANCED",
      priority: "LOW",
      description: "A high-performance enterprise analytics interface featuring real-time data visualizers, dark/light theme engine, and downloadable reports.",
      objective: "Demonstrate enterprise-grade frontend architecture, performance optimization, and professional UI polish.",
      skillsCovered: ["React", "APIs", "State Management", "Portfolio Preparedness"],
      requiredSkills: ["React", "APIs", "State Management"],
      techStack: ["React", "Chart.js / Recharts", "CSS Custom Properties", "Performance Tuning"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Design responsive multi-panel analytics layout with sidebar navigation",
        "Implement high-performance real-time simulated charts",
        "Create accessible custom Theme Toggle (Dark Horror / High Contrast)",
        "Write end-to-end component tests and bundle size optimizations"
      ]
    }
  ],

  "Backend Developer": [
    {
      id: "be-proj-1",
      title: "CLI Database & Record Management Utility",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A command-line tool connecting to a local database to perform record creation, query filtering, and automated report exports.",
      objective: "Understand backend scripting, database connection pools, and command execution logic.",
      skillsCovered: ["Programming", "Databases", "SQL"],
      requiredSkills: ["Programming"],
      techStack: ["Node.js / Python", "SQLite", "CLI"],
      estimatedEffort: "3–5 hours",
      milestones: [
        "Initialize CLI script and database connector",
        "Write SQL schema migrations for records table",
        "Implement parameterized queries preventing SQL injection",
        "Add automated CSV export functionality"
      ]
    },
    {
      id: "be-proj-2",
      title: "RESTful Notes & Task API Service",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A foundational REST API with full CRUD endpoints, URL route parameters, request payload validation, and JSON responses.",
      objective: "Master HTTP request/response cycles, status codes, and server-side routing.",
      skillsCovered: ["Backend Development", "APIs", "Programming"],
      requiredSkills: ["Programming", "Backend Development"],
      techStack: ["Node.js / Express / Python", "REST API", "Postman"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Set up HTTP server and configure routing table",
        "Implement GET, POST, PUT, DELETE REST endpoints",
        "Add structured JSON response format and status code handling",
        "Validate endpoints with automated Postman test collection"
      ]
    },
    {
      id: "be-proj-3",
      title: "Relational Student Information Management API",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A relational database backend API modeling students, courses, enrollments, and instructors with complex SQL JOIN queries.",
      objective: "Develop deep expertise in relational database schema design, foreign keys, and query optimization.",
      skillsCovered: ["Databases", "SQL", "APIs", "Backend Development"],
      requiredSkills: ["Backend Development", "Databases"],
      techStack: ["PostgreSQL / MySQL", "Node.js / Python", "SQL Joins"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Design normalized relational schema (1NF, 2NF, 3NF)",
        "Write complex SQL queries with INNER/LEFT JOINs and GROUP BY",
        "Implement pagination, sorting, and field filtering on API endpoints",
        "Add database transaction rollbacks for concurrent updates"
      ]
    },
    {
      id: "be-proj-4",
      title: "Secure Authentication & Session Microservice",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A production-grade auth service implementing password hashing, JWT token rotation, role verification, and rate limiting.",
      objective: "Master security principles, token cryptography, and authentication middleware.",
      skillsCovered: ["Authentication", "APIs", "Backend Development"],
      requiredSkills: ["Backend Development", "APIs"],
      techStack: ["Node.js / Python", "JWT", "Bcrypt", "Redis / Memory Cache"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Implement registration with salted password hashing",
        "Build login endpoint with JWT payload encryption",
        "Add middleware protecting private routes by user roles",
        "Implement brute-force rate limiter protecting login endpoints"
      ]
    },
    {
      id: "be-proj-5",
      title: "Multi-Author Blog & Comment Engine API",
      difficulty: "INTERMEDIATE",
      priority: "MEDIUM",
      description: "A comprehensive publishing backend supporting multi-author posts, threaded comments, tag indexing, and image upload handling.",
      objective: "Integrate relational data modeling, file storage, and hierarchical comment structures.",
      skillsCovered: ["Backend Development", "Databases", "SQL", "APIs"],
      requiredSkills: ["Backend Development", "Databases", "Authentication"],
      techStack: ["Express / Django / FastAPI", "PostgreSQL", "Multipart/Form-Data"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Model self-referential comment schema for nested replies",
        "Implement multipart file upload for author avatars and media",
        "Add full-text search indexing on post content and titles",
        "Create role permissions (Admin, Author, Subscriber)"
      ]
    },
    {
      id: "be-proj-6",
      title: "E-Commerce Order & Inventory Management API",
      difficulty: "ADVANCED",
      priority: "MEDIUM",
      description: "A scalable backend system for inventory tracking, order checkout pipelines, concurrent stock deduction, and webhook handling.",
      objective: "Master atomic database transactions, idempotency, and asynchronous webhook notifications.",
      skillsCovered: ["Backend Development", "APIs", "Databases", "Authentication"],
      requiredSkills: ["Backend Development", "Databases", "APIs"],
      techStack: ["FastAPI / Express", "PostgreSQL", "Transactions", "Webhooks"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Implement ACID transactional checkout preventing stock overselling",
        "Create webhook receiver endpoint with signature verification",
        "Build administrative sales and revenue query endpoints",
        "Write comprehensive integration test suite with mocking"
      ]
    },
    {
      id: "be-proj-7",
      title: "Role-Based Enterprise Access Control (RBAC) API",
      difficulty: "ADVANCED",
      priority: "MEDIUM",
      description: "An enterprise authorization service managing organizations, roles, dynamic permission matrices, and audit logging.",
      objective: "Implement complex security authorization models and compliance audit trails.",
      skillsCovered: ["Authentication", "Backend Development", "Databases", "SQL"],
      requiredSkills: ["Authentication", "Backend Development"],
      techStack: ["Node.js / Go / Python", "PostgreSQL", "Audit Logger"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Design permission matrix schema (User -> Role -> Permissions)",
        "Build dynamic middleware verifying granular API permissions",
        "Create immutable audit log recording all administrative actions",
        "Implement organization tenant data isolation"
      ]
    },
    {
      id: "be-proj-8",
      title: "Production-Ready Containerized Backend with CI/CD",
      difficulty: "ADVANCED",
      priority: "LOW",
      description: "A complete production backend deployment featuring Docker containerization, health metrics, and automated deployment.",
      objective: "Synthesize server development with cloud deployment practices.",
      skillsCovered: ["Deployment", "Git", "GitHub", "Backend Development"],
      requiredSkills: ["Backend Development", "APIs", "Databases"],
      techStack: ["Docker", "GitHub Actions", "Cloud VM / Render", "Prometheus"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Write multi-stage Dockerfile optimizing container image size",
        "Set up automated CI testing and linting via GitHub Actions",
        "Configure healthcheck endpoints and request latency metrics",
        "Deploy live backend to cloud container host"
      ]
    }
  ],

  "Full Stack Developer": [
    {
      id: "fs-proj-1",
      title: "Personal Portfolio with Dynamic Contact API",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A full stack web portfolio combining a responsive frontend with a lightweight backend API to process and email contact inquiries.",
      objective: "Establish end-to-end understanding connecting client-side fetch requests with backend server routes.",
      skillsCovered: ["HTML", "CSS", "JavaScript", "Backend Development", "APIs"],
      requiredSkills: ["HTML", "CSS", "JavaScript"],
      techStack: ["HTML5", "CSS3", "JavaScript", "Node.js / Express"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Build responsive frontend UI with contact form and validation",
        "Create backend Express endpoint to receive form submissions",
        "Add server-side input sanitization and notification dispatch",
        "Deploy frontend and backend to production hosting"
      ]
    },
    {
      id: "fs-proj-2",
      title: "Full Stack Collaborative To-Do Application",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A classic full stack productivity application with persistent database storage, task categories, and real-time status toggles.",
      objective: "Master complete CRUD lifecycles from database table to server route to client-side UI rendering.",
      skillsCovered: ["HTML", "CSS", "JavaScript", "Databases", "APIs", "SQL"],
      requiredSkills: ["HTML", "CSS", "JavaScript", "Backend Development"],
      techStack: ["React / Vanilla JS", "Node.js", "SQLite / PostgreSQL", "REST API"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Set up relational database table for tasks and categories",
        "Build REST API for task creation, update, and deletion",
        "Create responsive UI with optimistic updates and instant feedback",
        "Add filter tabs (All, Active, Completed, High Priority)"
      ]
    },
    {
      id: "fs-proj-3",
      title: "Full Stack Finance & Expense Management Portal",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A multi-user financial dashboard tracking budgets, transactions, recurring bills, and visual monthly breakdown charts.",
      objective: "Integrate database aggregation queries, client-side data visualizations, and full stack state synchronization.",
      skillsCovered: ["React", "Backend Development", "Databases", "SQL", "APIs"],
      requiredSkills: ["React", "Backend Development", "Databases"],
      techStack: ["React", "Node.js / Express", "PostgreSQL", "Chart.js"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Design database schema with foreign keys linking users and transactions",
        "Build API endpoints returning monthly aggregated spending sums",
        "Integrate interactive Chart.js analytics on frontend",
        "Add CSV export and date range transaction filtering"
      ]
    },
    {
      id: "fs-proj-4",
      title: "Community Blog & Discussion Forum Platform",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A full stack content platform with user authentication, rich text editing, threaded comments, and upvoting.",
      objective: "Master user authentication flows, session handling, relational comment trees, and responsive single-page architecture.",
      skillsCovered: ["Authentication", "React", "Backend Development", "Databases", "SQL"],
      requiredSkills: ["React", "Backend Development", "Authentication"],
      techStack: ["React", "Node.js", "PostgreSQL", "JWT Auth", "CSS Modules"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Implement secure JWT user registration and login across frontend/backend",
        "Build rich text editor and Markdown renderer for articles",
        "Implement nested comment replies and upvoting system",
        "Add user profile pages displaying author publication history"
      ]
    },
    {
      id: "fs-proj-5",
      title: "Food Delivery & Restaurant Ordering Application",
      difficulty: "ADVANCED",
      priority: "MEDIUM",
      description: "A full stack multi-restaurant ordering platform with live cart management, restaurant menus, order tracking, and driver status.",
      objective: "Develop complex multi-entity state architecture, transactional ordering, and real-time status updates.",
      skillsCovered: ["React", "Backend Development", "Databases", "APIs", "Authentication"],
      requiredSkills: ["React", "Backend Development", "Databases", "Authentication"],
      techStack: ["React", "Node.js / Express", "PostgreSQL", "Socket.io / Polling"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Model multi-restaurant catalog schema with item variations",
        "Build interactive shopping cart with delivery address validator",
        "Implement order checkout transaction pipeline",
        "Add live order progress status tracker with visual milestones"
      ]
    },
    {
      id: "fs-proj-6",
      title: "Full Stack E-Commerce Platform with Payment Integration",
      difficulty: "ADVANCED",
      priority: "MEDIUM",
      description: "An end-to-end commercial web store featuring catalog search, cart drawer, mock checkout payments, and administrative dashboard.",
      objective: "Build a complete production-grade web application combining all full stack development proficiencies.",
      skillsCovered: ["React", "Backend Development", "Databases", "Authentication", "Deployment"],
      requiredSkills: ["React", "Backend Development", "Databases", "Authentication"],
      techStack: ["React", "Node.js", "PostgreSQL / Stripe Mock", "Docker", "Cloud Deploy"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Create administrative product management portal with image uploads",
        "Implement customer shopping cart and secure checkout workflow",
        "Add customer order history and printable invoice generator",
        "Containerize with Docker and deploy live to production cloud"
      ]
    },
    {
      id: "fs-proj-7",
      title: "Multi-Tenant SaaS Project Management Dashboard",
      difficulty: "ADVANCED",
      priority: "LOW",
      description: "An enterprise-grade SaaS web portal with team workspaces, role permissions, activity logs, and real-time notifications.",
      objective: "Master tenant isolation, scalable database indexing, clean modular architecture, and CI/CD pipelines.",
      skillsCovered: ["Deployment", "Git", "GitHub", "Authentication", "Software Architecture"],
      requiredSkills: ["React", "Backend Development", "Databases", "Deployment"],
      techStack: ["React", "Node.js / Go", "PostgreSQL", "GitHub Actions", "Docker"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Implement multi-tenant organization database architecture",
        "Build customizable Kanban workspace with team member permissions",
        "Set up automated CI/CD deployment pipeline with GitHub Actions",
        "Write comprehensive end-to-end integration tests"
      ]
    }
  ],

  "Python Developer": [
    {
      id: "py-proj-1",
      title: "Python Command-Line System Utility",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A multi-command CLI tool using Python's argparse library for text processing, file conversions, and system status inspection.",
      objective: "Master Python standard libraries, modular code organization, arguments parsing, and terminal output formatting.",
      skillsCovered: ["Python", "OOP", "Git"],
      requiredSkills: ["Python"],
      techStack: ["Python 3", "Argparse", "CLI"],
      estimatedEffort: "3–5 hours",
      milestones: [
        "Structure modular Python project package with __main__.py",
        "Implement CLI subcommands with descriptive flags and help text",
        "Add formatted terminal outputs using color codes and progress bars",
        "Write unit tests with pytest for core logic functions"
      ]
    },
    {
      id: "py-proj-2",
      title: "Automated Desktop File & Asset Organizer",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A background automation utility that organizes messy directories by parsing file metadata, extensions, and modification timestamps.",
      objective: "Deepen skills with Python OS filesystem modules, path manipulation, and event logging.",
      skillsCovered: ["Python", "OOP", "File Handling"],
      requiredSkills: ["Python"],
      techStack: ["Python 3", "OS / Shutil / Pathlib", "Logging"],
      estimatedEffort: "3–5 hours",
      milestones: [
        "Scan directory tree recursively using Pathlib",
        "Categorize files into designated folders by extension and date",
        "Implement audit logging capturing all moved or renamed files",
        "Add dry-run simulation mode before executing destructive file moves"
      ]
    },
    {
      id: "py-proj-3",
      title: "Object-Oriented Student Database CLI",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "An OOP Python application managing student records, grade curves, course prerequisites, and persistent SQLite database storage.",
      objective: "Master object-oriented design patterns, inheritance, encapsulation, and relational SQL queries in Python.",
      skillsCovered: ["Python", "OOP", "Databases", "SQL"],
      requiredSkills: ["Python", "OOP"],
      techStack: ["Python 3", "SQLite3", "OOP Architecture"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Design class hierarchies for Person, Student, Instructor, and Course",
        "Create database schema with foreign keys and unique constraints",
        "Implement SQL parameterization and database context managers",
        "Add search filters, GPA statistics, and CSV import/export"
      ]
    },
    {
      id: "py-proj-4",
      title: "RESTful Web Microservice with FastAPI",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A high-performance modern Python REST API built with FastAPI, Pydantic type validation, and automatic OpenAPI documentation.",
      objective: "Develop web services in Python using modern async programming, type annotations, and OpenAPI standards.",
      skillsCovered: ["Python", "APIs", "Backend Development"],
      requiredSkills: ["Python", "APIs"],
      techStack: ["FastAPI", "Pydantic", "Uvicorn", "Postman"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Define request and response schemas using Pydantic models",
        "Implement async CRUD endpoints with path and query parameters",
        "Configure dependency injection for database connections and auth",
        "Verify interactive Swagger API documentation"
      ]
    },
    {
      id: "py-proj-5",
      title: "Automated Web Scraping & Data Pipeline",
      difficulty: "INTERMEDIATE",
      priority: "MEDIUM",
      description: "An automated web scraper extracting product prices or news headlines, transforming raw HTML, and storing cleaned data in SQL.",
      objective: "Master HTTP clients (Requests/Httpx), HTML parsing (BeautifulSoup), and data cleaning pipelines.",
      skillsCovered: ["Python", "Databases", "SQL", "Data Handling"],
      requiredSkills: ["Python", "Databases"],
      techStack: ["Python 3", "BeautifulSoup4", "Requests", "SQLite"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Implement polite scraping with user-agent rotation and rate limits",
        "Parse structured data from dynamic HTML trees",
        "Clean and validate scraped data strings into typed records",
        "Store records in SQL database with deduplication checks"
      ]
    },
    {
      id: "py-proj-6",
      title: "Production-Style Python Backend Service",
      difficulty: "ADVANCED",
      priority: "LOW",
      description: "A production-grade Python backend application with SQLAlchemy ORM, database migrations, automated pytest suites, and Dockerization.",
      objective: "Synthesize modern Python backend practices for industry readiness.",
      skillsCovered: ["Python", "APIs", "Databases", "SQL", "Testing & Automation"],
      requiredSkills: ["Python", "APIs", "Databases"],
      techStack: ["FastAPI / Flask", "SQLAlchemy", "Alembic", "Docker", "PyTest"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Configure SQLAlchemy declarative base and Alembic migrations",
        "Write comprehensive automated test suite with pytest and test DB",
        "Containerize microservice with Docker and environment config",
        "Deploy live to cloud hosting with CI test automation"
      ]
    }
  ],

  "Data Analyst": [
    {
      id: "da-proj-1",
      title: "Interactive Excel Sales & Performance Dashboard",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A structured business dashboard in Microsoft Excel featuring pivot tables, dynamic VLOOKUP/XLOOKUP formulas, and KPI summary charts.",
      objective: "Master spreadsheet data modeling, formula calculations, pivot charts, and business metrics presentation.",
      skillsCovered: ["Excel", "Data Visualization"],
      requiredSkills: ["Excel"],
      techStack: ["Microsoft Excel", "Pivot Tables", "Pivot Charts", "Formulas"],
      estimatedEffort: "3–5 hours",
      milestones: [
        "Clean raw transaction records and standardize date/currency formats",
        "Build dynamic pivot tables aggregating revenue by region and product",
        "Create interactive slicers and KPI summary metric tiles",
        "Format executive dashboard layout with clean visual hierarchy"
      ]
    },
    {
      id: "da-proj-2",
      title: "Academic Performance SQL Data Analysis",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A relational database investigation analyzing student grade trends, attendance correlations, and department distributions.",
      objective: "Master SQL query writing, aggregations (COUNT, AVG, SUM), WHERE filtering, and multi-table JOIN operations.",
      skillsCovered: ["SQL", "Data Cleaning"],
      requiredSkills: ["SQL"],
      techStack: ["SQL / PostgreSQL", "Relational Database", "Data Analysis"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Write multi-table SQL queries joining students, courses, and scores",
        "Calculate department GPAs, pass rates, and percentile ranks",
        "Identify statistically underperforming course cohorts",
        "Export findings into summary report table"
      ]
    },
    {
      id: "da-proj-3",
      title: "E-Commerce Customer & Sales Exploration with Pandas",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "An in-depth Python data analysis exploring an e-commerce transaction dataset with Pandas, analyzing sales seasonality and revenue drivers.",
      objective: "Develop fluency with Pandas DataFrames, indexing, filtering, groupby aggregations, and data manipulation.",
      skillsCovered: ["Python", "Pandas", "Statistics", "Data Cleaning"],
      requiredSkills: ["Python", "Pandas"],
      techStack: ["Python", "Pandas", "Jupyter Notebook", "NumPy"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Load and clean messy 50,000+ row CSV dataset with Pandas",
        "Handle missing values, duplicate records, and invalid data types",
        "Compute monthly recurring revenue and average order value trends",
        "Document analytical insights and business recommendations"
      ]
    },
    {
      id: "da-proj-4",
      title: "Customer Churn & Retention Visual Analytics",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A visual exploration of customer subscription churn using Matplotlib and Seaborn to identify high-risk churn indicators.",
      objective: "Master data visualization principles, exploratory data analysis (EDA), and correlation charts.",
      skillsCovered: ["Data Visualization", "Statistics", "Python", "Pandas"],
      requiredSkills: ["Python", "Pandas", "Data Visualization"],
      techStack: ["Python", "Pandas", "Matplotlib", "Seaborn"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Generate distribution histograms and boxplots for user tenure",
        "Build correlation heatmap identifying primary churn drivers",
        "Visualize customer cohort retention curves over 12 months",
        "Assemble visual presentation summarizing actionable takeaways"
      ]
    },
    {
      id: "da-proj-5",
      title: "Automated Data Cleaning & ETL Pipeline",
      difficulty: "INTERMEDIATE",
      priority: "MEDIUM",
      description: "A Python script that ingests messy multi-source data files, executes automated validation rules, and outputs clean normalized datasets.",
      objective: "Develop robust data cleaning scripts and understand automated data pipeline architecture.",
      skillsCovered: ["Data Cleaning", "Python", "Pandas", "SQL"],
      requiredSkills: ["Python", "Pandas", "SQL"],
      techStack: ["Python", "Pandas", "SQLite / CSV", "Data Validation"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Build automated data type validation and outlier detection rules",
        "Standardize inconsistent date formats and text categorical values",
        "Implement automated error logging for corrupted records",
        "Load cleaned records into relational database tables"
      ]
    },
    {
      id: "da-proj-6",
      title: "Executive Business KPI & Revenue Visual Dashboard",
      difficulty: "ADVANCED",
      priority: "MEDIUM",
      description: "A comprehensive business intelligence report combining SQL database extraction, Python aggregation, and visual KPI presentation.",
      objective: "Demonstrate end-to-end data analyst skills: data extraction, statistical synthesis, and executive communication.",
      skillsCovered: ["Data Visualization", "Business Intelligence", "SQL", "Statistics"],
      requiredSkills: ["SQL", "Python", "Data Visualization", "Statistics"],
      techStack: ["SQL", "Python / Streamlit", "Data Storytelling"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Extract business metrics across multi-table SQL queries",
        "Calculate YoY growth rates, customer lifetime value (LTV), and CAC",
        "Design polished multi-panel visual dashboard with interactive filters",
        "Deliver executive summary report with strategic growth recommendations"
      ]
    }
  ],

  "Data Scientist": [
    {
      id: "ds-proj-1",
      title: "Exploratory Data Analysis & Statistical Profiling",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A rigorous statistical investigation of a public dataset computing distributions, hypothesis tests, and variable correlations.",
      objective: "Master descriptive statistics, probability distributions, and exploratory data analysis in Python.",
      skillsCovered: ["Python", "Statistics", "Pandas", "NumPy", "Data Visualization"],
      requiredSkills: ["Python", "Statistics"],
      techStack: ["Python", "Pandas", "NumPy", "Scipy", "Seaborn"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Perform missing data analysis and outlier detection using IQR",
        "Calculate mean, median, skewness, and variance metrics",
        "Execute hypothesis testing (t-test / chi-square) on key variables",
        "Document analytical findings in structured Jupyter notebook"
      ]
    },
    {
      id: "ds-proj-2",
      title: "Housing Price Regression & Valuation Model",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A supervised machine learning model predicting continuous property prices using feature engineering, linear regression, and regularization.",
      objective: "Master regression algorithms, feature scaling, collinearity handling, and regression evaluation metrics (RMSE, R2).",
      skillsCovered: ["Machine Learning", "Python", "Statistics", "Pandas"],
      requiredSkills: ["Python", "Pandas", "Statistics"],
      techStack: ["Python", "Scikit-Learn", "Pandas", "Regression"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Perform one-hot encoding on categorical neighborhood variables",
        "Train Linear Regression, Ridge, and Lasso regularized models",
        "Evaluate model performance using Cross-Validation and RMSE",
        "Interpret feature importance coefficients and model residuals"
      ]
    },
    {
      id: "ds-proj-3",
      title: "Customer Churn Binary Classification Engine",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A predictive classification system identifying customers likely to cancel subscription services using Random Forest and Logistic Regression.",
      objective: "Understand classification metrics (Precision, Recall, F1-Score, ROC-AUC) and handle imbalanced class distributions.",
      skillsCovered: ["Machine Learning", "Python", "Data Visualization"],
      requiredSkills: ["Python", "Machine Learning", "Pandas"],
      techStack: ["Python", "Scikit-Learn", "Random Forest", "Imbalanced-Learn"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Handle imbalanced class data using SMOTE / class weighting",
        "Train Logistic Regression and Random Forest classifier models",
        "Plot Confusion Matrix and ROC-AUC performance curves",
        "Tune hyperparameters using GridSearchCV"
      ]
    },
    {
      id: "ds-proj-4",
      title: "Personalized Product Recommendation Engine",
      difficulty: "INTERMEDIATE",
      priority: "MEDIUM",
      description: "A recommendation algorithm combining collaborative filtering (cosine similarity / matrix factorization) to suggest relevant items.",
      objective: "Implement similarity metrics, sparse matrix manipulation, and collaborative filtering algorithms.",
      skillsCovered: ["Machine Learning", "NumPy", "Pandas", "Python"],
      requiredSkills: ["Python", "NumPy", "Machine Learning"],
      techStack: ["Python", "Scikit-Learn", "NumPy", "Cosine Similarity"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Construct user-item interaction matrix with sparse arrays",
        "Compute user and item similarity vectors using cosine metric",
        "Implement top-N recommendation generation function",
        "Evaluate recommendation diversity and precision at K"
      ]
    },
    {
      id: "ds-proj-5",
      title: "End-to-End Machine Learning Pipeline & Validation",
      difficulty: "ADVANCED",
      priority: "LOW",
      description: "A complete reproducible data science pipeline from data ingestion and transformation to model training and serialized artifact export.",
      objective: "Synthesize full data science lifecycle, pipeline modularity, and model evaluation rigor.",
      skillsCovered: ["Machine Learning", "Model Evaluation", "Python", "SQL"],
      requiredSkills: ["Machine Learning", "Statistics", "Python"],
      techStack: ["Python", "Scikit-Learn Pipeline", "Joblib", "SQL"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Construct Scikit-Learn Pipeline combining encoders and model",
        "Execute stratified k-fold cross validation across model candidates",
        "Serialize tuned model pipeline using Joblib",
        "Write comprehensive technical report documenting model accuracy"
      ]
    }
  ],

  "AI/ML Engineer": [
    {
      id: "ai-proj-1",
      title: "Linear Algebra & Gradient Descent From Scratch",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "An algorithmic implementation of matrix multiplication, vector calculus, and gradient descent optimization without external ML libraries.",
      objective: "Deepen understanding of core mathematical foundations underpinning all modern machine learning models.",
      skillsCovered: ["Mathematics", "Python", "Data Structures & Algorithms"],
      requiredSkills: ["Python"],
      techStack: ["Python 3", "NumPy", "Mathematical Optimization"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Implement vector dot products and matrix operations from scratch",
        "Code batch and stochastic gradient descent optimization loops",
        "Visualize cost function convergence over training iterations",
        "Verify mathematical gradient calculations against analytical derivatives"
      ]
    },
    {
      id: "ai-proj-2",
      title: "Supervised ML Classification Model with Feature Engineering",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A production machine learning workflow with advanced feature scaling, interaction terms, and ensemble classifiers.",
      objective: "Master feature engineering pipelines, model selection, and cross-validation.",
      skillsCovered: ["Machine Learning", "Python", "Statistics"],
      requiredSkills: ["Python", "Mathematics", "Statistics"],
      techStack: ["Python", "Scikit-Learn", "Feature Engineering"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Build custom feature transformations and interaction variables",
        "Train Gradient Boosted Decision Trees (XGBoost / LightGBM)",
        "Optimize hyperparameters using Bayesian Optimization",
        "Calculate SHAP values for model feature interpretability"
      ]
    },
    {
      id: "ai-proj-3",
      title: "NLP Text Classification & Sentiment Analysis",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A natural language processing pipeline that tokenizes text, generates TF-IDF / embedding vectors, and classifies customer sentiments.",
      objective: "Understand NLP text preprocessing, vocabulary vectorization, and language classification models.",
      skillsCovered: ["Machine Learning", "Python", "Data Structures & Algorithms"],
      requiredSkills: ["Python", "Machine Learning"],
      techStack: ["Python", "NLTK / Spacy", "Scikit-Learn", "TF-IDF"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Build text cleaning, tokenization, and lemmatization pipeline",
        "Transform text corpus into sparse TF-IDF feature matrices",
        "Train and benchmark Naive Bayes and Support Vector Classifiers",
        "Evaluate classification accuracy across multi-class sentiment dataset"
      ]
    },
    {
      id: "ai-proj-4",
      title: "Deep Convolutional Neural Network (CNN) Image Classifier",
      difficulty: "INTERMEDIATE",
      priority: "MEDIUM",
      description: "A deep learning neural network constructed with PyTorch/TensorFlow to classify image datasets (e.g. CIFAR-10 / MNIST).",
      objective: "Master convolution layers, pooling, backpropagation, and deep learning training dynamics.",
      skillsCovered: ["Deep Learning", "Machine Learning", "Mathematics"],
      requiredSkills: ["Machine Learning", "Mathematics", "Python"],
      techStack: ["PyTorch / TensorFlow", "CNN Architecture", "GPU Training"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Build custom PyTorch dataset and data augmentation pipeline",
        "Design CNN architecture with Conv2D, BatchNorm, and Dropout",
        "Implement custom training loop tracking loss and accuracy curves",
        "Evaluate test set generalization and visualize convolutional filters"
      ]
    },
    {
      id: "ai-proj-5",
      title: "ML Model Deployment as High-Throughput REST API",
      difficulty: "ADVANCED",
      priority: "LOW",
      description: "A production model serving system that loads serialized ML models, validates input inference payloads, and serves real-time predictions.",
      objective: "Master model serialization, inference latency optimization, and REST API deployment.",
      skillsCovered: ["Model Deployment", "APIs", "Python", "Deep Learning"],
      requiredSkills: ["Machine Learning", "Python", "APIs"],
      techStack: ["FastAPI", "Docker", "ONNX / PyTorch", "Postman"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Optimize and export model to ONNX runtime format",
        "Build async FastAPI inference endpoint with Pydantic validation",
        "Containerize deployment environment using Docker",
        "Measure inference latency and benchmark concurrent throughput"
      ]
    }
  ],

  "Cybersecurity Engineer": [
    {
      id: "sec-proj-1",
      title: "Linux Security Hardening & Permission Audit Lab",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A hands-on system administration lab auditing file permissions, SUID binaries, SSH security configs, and user privileges on Linux.",
      objective: "Understand OS access control lists, root privileges, and defensive system hardening.",
      skillsCovered: ["Operating Systems", "Linux", "Cybersecurity Fundamentals"],
      requiredSkills: ["Linux"],
      techStack: ["Linux / Bash", "SSH Config", "File Permissions"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Audit all SUID/SGID executable binaries on the system",
        "Harden SSH daemon configuration disabling root login and password auth",
        "Configure UFW / Iptables firewall rules allowing only essential ports",
        "Generate security compliance checklist report"
      ]
    },
    {
      id: "sec-proj-2",
      title: "Network Packet Sniffer & Traffic Analysis Tool",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A Python packet analysis utility using Scapy/Sockets to capture local network traffic, parse TCP/UDP headers, and detect port scans.",
      objective: "Develop deep comprehension of TCP/IP networking, packet structures, and anomaly detection.",
      skillsCovered: ["Networking", "Cybersecurity Fundamentals", "Linux"],
      requiredSkills: ["Networking", "Operating Systems"],
      techStack: ["Python / Scapy", "Wireshark", "TCP/IP Protocol Stack"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Capture raw network frames and parse IP, TCP, and UDP headers",
        "Filter traffic by protocol, destination port, and source IP",
        "Implement detection rule identifying rapid SYN port scanning attempts",
        "Log suspicious traffic anomalies into structured JSON alerts"
      ]
    },
    {
      id: "sec-proj-3",
      title: "Password Hashing & Cryptographic Demonstration Lab",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "A security demonstration evaluating password entropy, salt protections, and rainbow table resistance across hashing algorithms.",
      objective: "Master cryptographic hashing (Bcrypt, Argon2, SHA-256), salts, and password defense mechanisms.",
      skillsCovered: ["Cryptography", "Authentication", "Cybersecurity Fundamentals"],
      requiredSkills: ["Cybersecurity Fundamentals", "Authentication"],
      techStack: ["Python", "Bcrypt", "Argon2", "Cryptography Library"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Benchmark hash computation times across MD5, SHA-256, and Bcrypt",
        "Demonstrate vulnerability of unsalted hashes to lookup tables",
        "Implement secure password storage utilizing Argon2id",
        "Write security guideline on modern password storage policies"
      ]
    },
    {
      id: "sec-proj-4",
      title: "Automated Security Log Parser & Threat Alert Engine",
      difficulty: "INTERMEDIATE",
      priority: "MEDIUM",
      description: "A defensive SIEM-style log monitoring tool parsing auth logs (e.g. /var/log/auth.log) for brute force attacks and privilege escalation.",
      objective: "Master security log analysis, pattern matching, and automated incident alerting.",
      skillsCovered: ["Security Tools", "Linux", "Cybersecurity Fundamentals"],
      requiredSkills: ["Linux", "Operating Systems", "Cybersecurity Fundamentals"],
      techStack: ["Python", "Linux Logs", "Regex Pattern Matching"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Stream and parse real-time authentication logs using regex",
        "Implement sliding-window detection for repeated failed login attempts",
        "Generate high-priority security alert notifications",
        "Export structured security incident reports"
      ]
    },
    {
      id: "sec-proj-5",
      title: "Defensive Web Security Vulnerability Assessment Lab",
      difficulty: "ADVANCED",
      priority: "LOW",
      description: "A defensive security review auditing web applications for OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF) with remediation code fixes.",
      objective: "Identify common web vulnerabilities and implement defensive programming countermeasures.",
      skillsCovered: ["Security Tools", "Incident Response", "Authentication", "Networking"],
      requiredSkills: ["Authentication", "Cybersecurity Fundamentals", "Networking"],
      techStack: ["OWASP Top 10", "Burp Suite (Community)", "Defensive Coding"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Audit vulnerable demonstration application for SQL Injection vectors",
        "Test and demonstrate Cross-Site Scripting (XSS) input vulnerabilities",
        "Implement parameterized queries and CSP header defensive fixes",
        "Author comprehensive remediation security report"
      ]
    }
  ],

  "Cloud Engineer": [
    {
      id: "cld-proj-1",
      title: "Linux Cloud Virtual Machine Configuration & Security",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "Provision and configure a secure cloud virtual machine (AWS EC2 / GCP Compute Engine) with custom firewall rules and SSH keys.",
      objective: "Master cloud virtual instance management, SSH security, and cloud firewall rules.",
      skillsCovered: ["Linux", "Cloud Fundamentals", "Networking"],
      requiredSkills: ["Linux"],
      techStack: ["AWS / GCP", "Linux VM", "SSH Keys", "Security Groups"],
      estimatedEffort: "3–5 hours",
      milestones: [
        "Generate SSH key pairs and launch cloud VM instance",
        "Configure cloud Security Groups restricting public access to port 22/80/443",
        "Install and configure Nginx web server on Linux VM",
        "Verify secure HTTPS certificate deployment"
      ]
    },
    {
      id: "cld-proj-2",
      title: "Static Website Cloud Hosting with CDN & SSL",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "Deploy a highly-available static website using cloud object storage (AWS S3 / GCP Storage) integrated with CloudFront CDN and custom domain.",
      objective: "Understand cloud object storage, static web hosting, and content delivery networks (CDNs).",
      skillsCovered: ["Cloud Fundamentals", "Networking", "AWS"],
      requiredSkills: ["Cloud Fundamentals"],
      techStack: ["AWS S3 / CloudFront", "DNS (Route53)", "SSL Certificate"],
      estimatedEffort: "3–5 hours",
      milestones: [
        "Create and configure cloud storage bucket with public read policies",
        "Set up CloudFront CDN distribution caching edge content worldwide",
        "Configure custom DNS domain records and SSL certificate",
        "Benchmark page load latency improvements via CDN caching"
      ]
    },
    {
      id: "cld-proj-3",
      title: "Cloud-Hosted REST API Backend Service",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "Deploy a backend API application on cloud compute infrastructure with managed database connections and environment secrets.",
      objective: "Deploy server applications to cloud environments using best practices for secrets and databases.",
      skillsCovered: ["Cloud Fundamentals", "AWS", "Deployment", "Networking"],
      requiredSkills: ["Cloud Fundamentals", "Linux"],
      techStack: ["AWS / GCP", "Node.js / Python API", "Managed SQL / RDS"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Provision managed cloud database instance (RDS / Cloud SQL)",
        "Configure environment secrets securely using Cloud Secrets Manager",
        "Deploy backend application with process manager (PM2 / Systemd)",
        "Test API responsiveness and database connection latency"
      ]
    },
    {
      id: "cld-proj-4",
      title: "Containerized Microservice Deployment on Cloud",
      difficulty: "INTERMEDIATE",
      priority: "MEDIUM",
      description: "Containerize a multi-container application with Docker and deploy to cloud container services (AWS ECS / GCP Cloud Run).",
      objective: "Master Docker containerization, container registries, and serverless container hosting.",
      skillsCovered: ["Containers", "AWS", "GCP", "Deployment"],
      requiredSkills: ["Cloud Fundamentals", "Containers"],
      techStack: ["Docker", "AWS ECS / Cloud Run", "Container Registry (ECR)"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Build production Docker image and push to Cloud Container Registry",
        "Configure task definitions, CPU/memory allocations, and ports",
        "Deploy containerized service to Cloud Run / ECS cluster",
        "Test auto-scaling under simulated request traffic"
      ]
    },
    {
      id: "cld-proj-5",
      title: "High-Availability Multi-Tier Cloud Architecture",
      difficulty: "ADVANCED",
      priority: "LOW",
      description: "Architect a resilient multi-tier cloud infrastructure featuring Application Load Balancers, Auto-Scaling Groups, and multi-AZ database replicas.",
      objective: "Design enterprise-grade cloud systems resilient against single-point failures.",
      skillsCovered: ["Cloud Fundamentals", "Networking", "Infrastructure", "Deployment"],
      requiredSkills: ["Cloud Fundamentals", "Networking", "Containers"],
      techStack: ["AWS / GCP", "Application Load Balancer", "Auto Scaling", "Multi-AZ"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Design VPC network topology across two availability zones (Multi-AZ)",
        "Configure Application Load Balancer distributing traffic to target groups",
        "Set up Auto-Scaling policy scaling instances based on CPU utilization",
        "Simulate instance failure and verify zero-downtime failover"
      ]
    }
  ],

  "DevOps Engineer": [
    {
      id: "dops-proj-1",
      title: "Git Collaborative Branching Strategy & Automation Lab",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "Set up a structured repository implementing GitFlow branching, commit validation hooks (Husky), and branch protection rules.",
      objective: "Master professional version control workflows and automated pre-commit validation.",
      skillsCovered: ["Git", "Automation", "Linux"],
      requiredSkills: ["Git"],
      techStack: ["Git", "GitHub", "Husky / Git Hooks", "Shell Scripting"],
      estimatedEffort: "3–5 hours",
      milestones: [
        "Initialize repository with Main, Develop, and Feature branches",
        "Configure pre-commit hooks running code linters and formatting checks",
        "Set up GitHub branch protection rules enforcing pull request reviews",
        "Simulate and resolve complex Git merge conflicts"
      ]
    },
    {
      id: "dops-proj-2",
      title: "Linux Server Administration & Automation Scripts",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "A collection of robust Bash/Python scripts automating system updates, backup archives, disk space monitoring, and log rotation.",
      objective: "Automate repetitive server maintenance tasks using Shell and Cron scheduling.",
      skillsCovered: ["Linux", "Automation", "Git"],
      requiredSkills: ["Linux"],
      techStack: ["Bash / Shell", "Linux Crontab", "Automation"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Write automated database and configuration backup script",
        "Implement disk space usage monitor sending automated alert warnings",
        "Schedule automated scripts using Cron daemon on Linux",
        "Add error trapping and execution logs to all scripts"
      ]
    },
    {
      id: "dops-proj-3",
      title: "Automated CI Pipeline with GitHub Actions",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "Build an automated continuous integration pipeline that triggers on pull requests to run unit tests, security scans, and code linters.",
      objective: "Master CI pipeline configuration, automated testing triggers, and build matrices.",
      skillsCovered: ["CI/CD", "Git", "Automation"],
      requiredSkills: ["Git", "Linux"],
      techStack: ["GitHub Actions", "YAML", "Automated Testing", "Linters"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Write GitHub Actions workflow YAML configuration",
        "Set up parallel test execution matrix across multiple versions",
        "Add automated security dependency vulnerability scanning",
        "Configure status badges and PR merge blockers on test failures"
      ]
    },
    {
      id: "dops-proj-4",
      title: "Multi-Service Containerization with Docker Compose",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "Containerize a full stack application (Frontend + Backend + PostgreSQL + Redis) ensuring seamless local development environment parity.",
      objective: "Master Dockerfile writing, multi-container networking, volumes, and environment variables.",
      skillsCovered: ["Docker", "Linux", "Deployment"],
      requiredSkills: ["Linux", "Containers"],
      techStack: ["Docker", "Docker Compose", "Multi-stage Builds"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Write optimized multi-stage Dockerfiles for client and server",
        "Configure Docker Compose with internal networks and persistent volumes",
        "Set up container dependency health checks and start ordering",
        "Verify single-command environment startup (docker compose up)"
      ]
    },
    {
      id: "dops-proj-5",
      title: "End-to-End Automated CI/CD Deployment Pipeline",
      difficulty: "ADVANCED",
      priority: "MEDIUM",
      description: "An automated pipeline that tests code, builds Docker images, pushes to a container registry, and deploys to cloud hosting.",
      objective: "Build complete end-to-end continuous delivery pipeline from git push to live production update.",
      skillsCovered: ["CI/CD", "Docker", "Cloud", "Deployment"],
      requiredSkills: ["CI/CD", "Docker", "Git"],
      techStack: ["GitHub Actions", "Docker", "Cloud Host / Render", "SSH Deploy"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Set up automated build and container push job on main branch merge",
        "Configure cloud hosting webhook triggering zero-downtime deployment",
        "Implement post-deployment smoke test verification script",
        "Add rollback trigger returning to previous image tag on error"
      ]
    }
  ],

  "UI/UX Designer": [
    {
      id: "ui-proj-1",
      title: "Mobile Habit Tracking App Wireframing & Information Architecture",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "Create user flows, low-fidelity wireframes, and information architecture diagrams for a mobile daily habit tracking application.",
      objective: "Master user journey mapping, visual hierarchy, and low-fidelity screen layout wireframing.",
      skillsCovered: ["UI Design Principles", "UX Design Principles", "Wireframing"],
      requiredSkills: ["UI Design Principles"],
      techStack: ["Figma / Pen & Paper", "Wireframing", "User Flows"],
      estimatedEffort: "3–5 hours",
      milestones: [
        "Map primary user journey and task completion flow",
        "Sketch low-fidelity wireframes for 6 core mobile screens",
        "Organize navigation hierarchy and screen transition paths",
        "Conduct preliminary usability walkthrough review"
      ]
    },
    {
      id: "ui-proj-2",
      title: "SaaS Product Landing Page Visual UI Design",
      difficulty: "BEGINNER",
      priority: "HIGH",
      description: "Design a high-fidelity visual layout for a developer SaaS tool in Figma, establishing typography, color palettes, and component cards.",
      objective: "Master typography scales, spacing grids, contrast ratios, and modern UI aesthetic composition.",
      skillsCovered: ["UI Design Principles", "Figma", "Design Systems"],
      requiredSkills: ["UI Design Principles", "Figma"],
      techStack: ["Figma", "Typography", "Color Theory", "Grid Systems"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Establish cohesive 8pt spacing grid and typographic scale",
        "Design Hero section, feature matrices, and pricing cards",
        "Apply dark theme aesthetics with accessible WCAG contrast",
        "Export visual assets and design specifications for developers"
      ]
    },
    {
      id: "ui-proj-3",
      title: "E-Commerce User Experience & Usability Research Case Study",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "Conduct user research, identify checkout friction points, and redesign the checkout experience of an e-commerce mobile app.",
      objective: "Conduct user research, synthesize usability feedback, and create problem-solution UX case studies.",
      skillsCovered: ["User Research", "UX Design Principles", "Wireframing"],
      requiredSkills: ["UX Design Principles", "User Research"],
      techStack: ["Figma", "User Personas", "Usability Testing", "Case Study"],
      estimatedEffort: "6–10 hours",
      milestones: [
        "Develop 2 target user personas and empathy maps",
        "Audit existing checkout workflows and identify 3 critical friction points",
        "Create revised checkout wireframe reducing user completion steps",
        "Document findings in a structured UX case study presentation"
      ]
    },
    {
      id: "ui-proj-4",
      title: "Interactive Food Delivery App High-Fidelity Prototype",
      difficulty: "INTERMEDIATE",
      priority: "HIGH",
      description: "Build an interactive, clickable prototype in Figma with micro-interactions, smart animations, food menus, and order tracking.",
      objective: "Master advanced Figma prototyping tools, component states, and micro-interaction design.",
      skillsCovered: ["Prototyping", "Figma", "UI Design Principles"],
      requiredSkills: ["Figma", "UI Design Principles"],
      techStack: ["Figma Interactive Components", "Smart Animate", "Prototyping"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Build interactive components with hover and active variant states",
        "Connect screens using Figma Smart Animate for seamless transitions",
        "Create realistic cart sheet modal and live delivery tracker animations",
        "Conduct interactive prototype user testing session"
      ]
    },
    {
      id: "ui-proj-5",
      title: "Comprehensive Design System & Component Library",
      difficulty: "ADVANCED",
      priority: "MEDIUM",
      description: "Construct a complete reusable Design System in Figma including design tokens, button variants, forms, navigation, and documentation.",
      objective: "Master enterprise design system creation, auto-layout, component variants, and developer handoff guidelines.",
      skillsCovered: ["Design Systems", "Figma", "UI Design Principles"],
      requiredSkills: ["Figma", "UI Design Principles", "Design Systems"],
      techStack: ["Figma Auto-Layout", "Design Tokens", "Component Variants"],
      estimatedEffort: "10–20 hours",
      milestones: [
        "Define global design tokens (Colors, Spacing, Typography, Shadows)",
        "Build atomic component library (Buttons, Inputs, Badges, Modals)",
        "Utilize Figma Auto-Layout and component properties across all assets",
        "Write comprehensive component usage documentation for developers"
      ]
    },
    {
      id: "ui-proj-6",
      title: "End-to-End Product Redesign & UX Portfolio Case Study",
      difficulty: "ADVANCED",
      priority: "LOW",
      description: "A complete end-to-end UX case study documenting research, wireframes, design system, interactive prototype, and usability validation.",
      objective: "Synthesize full UX design process into an industry-ready portfolio case study.",
      skillsCovered: ["Design Portfolio", "User Research", "Prototyping", "Design Systems"],
      requiredSkills: ["User Research", "Figma", "Prototyping", "Design Systems"],
      techStack: ["Figma", "Case Study Portfolio", "Usability Metrics"],
      estimatedEffort: "20–30 hours",
      milestones: [
        "Synthesize problem statement, competitive analysis, and user research",
        "Show progression from low-fi wireframes to high-fi prototype",
        "Incorporate usability testing validation metrics and design iterations",
        "Publish complete case study ready for professional portfolio reviews"
      ]
    }
  ]
};

async function seedProjectCatalog() {
  const isDbConfigured = Boolean(config.TIDB_HOST && config.TIDB_HOST.trim() !== '');
  if (!isDbConfigured) {
    console.log('[Seed] Database not configured (TIDB_HOST missing). Skipping database seed.');
    return { count: 0, dbConfigured: false };
  }

  let totalInserted = 0;

  try {
    for (const [career, projects] of Object.entries(careerProjectCatalog)) {
      for (const proj of projects) {
        await pool.query(
          `INSERT INTO project_catalog (
            project_key, target_career, title, difficulty, description,
            required_skills, recommended_skills, priority, why_this_project,
            milestones, estimated_effort
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            target_career = VALUES(target_career),
            title = VALUES(title),
            difficulty = VALUES(difficulty),
            description = VALUES(description),
            required_skills = VALUES(required_skills),
            recommended_skills = VALUES(recommended_skills),
            priority = VALUES(priority),
            why_this_project = VALUES(why_this_project),
            milestones = VALUES(milestones),
            estimated_effort = VALUES(estimated_effort)`,
          [
            proj.id,
            career,
            proj.title,
            proj.difficulty,
            proj.description || '',
            JSON.stringify(proj.requiredSkills || []),
            JSON.stringify(proj.skillsCovered || []),
            proj.priority || 'MEDIUM',
            proj.whyThisProject || '',
            JSON.stringify(proj.milestones || []),
            proj.estimatedEffort || '6–10 hours'
          ]
        );
        totalInserted++;
      }
    }

    console.log(`[Seed] Successfully seeded ${totalInserted} projects across 12 careers into project_catalog.`);
    return { count: totalInserted, dbConfigured: true };
  } catch (err) {
    console.error('[Seed] Error seeding project catalog:', err);
    throw err;
  }
}

if (require.main === module) {
  seedProjectCatalog()
    .then((res) => {
      console.log('[Seed] Complete:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Failed:', err);
      process.exit(1);
    });
}

module.exports = {
  careerProjectCatalog,
  seedProjectCatalog
};
