-- CareerPilot AI Initial Relational Schema
-- Migration 001_initial_schema.sql

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  location VARCHAR(160) NULL,
  college VARCHAR(200) NULL,
  degree VARCHAR(100) NULL,
  branch VARCHAR(160) NULL,
  current_year VARCHAR(50) NULL,
  graduation_year SMALLINT NULL,
  target_career VARCHAR(120) NULL,
  experience_level VARCHAR(30) NULL,
  career_goal TEXT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_profiles_target_career (target_career),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. profile_skills
CREATE TABLE IF NOT EXISTS profile_skills (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  skill_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_skill (user_id, skill_name),
  INDEX idx_profile_skills_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. profile_interests
CREATE TABLE IF NOT EXISTS profile_interests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  interest_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_interest (user_id, interest_name),
  INDEX idx_profile_interests_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. assessment_reports
CREATE TABLE IF NOT EXISTS assessment_reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  career_direction VARCHAR(160) NULL,
  profile_summary TEXT NULL,
  strengths JSON NULL,
  current_skills JSON NULL,
  focus_areas JSON NULL,
  career_advice TEXT NULL,
  confidence_level VARCHAR(20) NULL,
  profile_fingerprint VARCHAR(255) NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_assessment_user_gen (user_id, generated_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. readiness_reports
CREATE TABLE IF NOT EXISTS readiness_reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  target_career VARCHAR(120) NOT NULL,
  score TINYINT UNSIGNED NOT NULL,
  status VARCHAR(80) NOT NULL,
  required_skills JSON NULL,
  met_skills JSON NULL,
  missing_skills JSON NULL,
  skill_gaps JSON NULL,
  high_priority_count INT UNSIGNED NOT NULL DEFAULT 0,
  medium_priority_count INT UNSIGNED NOT NULL DEFAULT 0,
  low_priority_count INT UNSIGNED NOT NULL DEFAULT 0,
  covered_count INT UNSIGNED NOT NULL DEFAULT 0,
  required_count INT UNSIGNED NOT NULL DEFAULT 0,
  alignment VARCHAR(120) NULL,
  summary TEXT NULL,
  advice TEXT NULL,
  profile_fingerprint VARCHAR(255) NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_readiness_user_gen (user_id, generated_at),
  INDEX idx_readiness_user_target (user_id, target_career),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. roadmap_instances
CREATE TABLE IF NOT EXISTS roadmap_instances (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  target_career VARCHAR(120) NOT NULL,
  readiness_score TINYINT UNSIGNED NULL,
  status VARCHAR(120) NULL,
  total_items INT UNSIGNED NOT NULL DEFAULT 0,
  completed_items INT UNSIGNED NOT NULL DEFAULT 0,
  upcoming_items INT UNSIGNED NOT NULL DEFAULT 0,
  high_priority_items INT UNSIGNED NOT NULL DEFAULT 0,
  estimated_total_effort VARCHAR(100) NULL,
  profile_fingerprint VARCHAR(255) NULL,
  readiness_fingerprint VARCHAR(255) NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_roadmap_instances_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. roadmap_items
CREATE TABLE IF NOT EXISTS roadmap_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  roadmap_id BIGINT UNSIGNED NOT NULL,
  skill VARCHAR(160) NOT NULL,
  stage VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'UPCOMING',
  reason TEXT NULL,
  prerequisites JSON NULL,
  estimated_effort VARCHAR(50) NULL,
  item_order INT NOT NULL,
  UNIQUE KEY uk_roadmap_order (roadmap_id, item_order),
  INDEX idx_roadmap_items_roadmap_id (roadmap_id),
  FOREIGN KEY (roadmap_id) REFERENCES roadmap_instances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. project_catalog
CREATE TABLE IF NOT EXISTS project_catalog (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_key VARCHAR(120) NOT NULL UNIQUE,
  target_career VARCHAR(120) NOT NULL,
  title VARCHAR(200) NOT NULL,
  difficulty VARCHAR(30) NOT NULL,
  description TEXT NULL,
  required_skills JSON NULL,
  recommended_skills JSON NULL,
  priority VARCHAR(20) NULL,
  why_this_project TEXT NULL,
  milestones JSON NULL,
  estimated_effort VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_project_catalog_target_career (target_career)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. user_projects
CREATE TABLE IF NOT EXISTS user_projects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_project (user_id, project_id),
  INDEX idx_user_projects_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES project_catalog(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. interview_questions
CREATE TABLE IF NOT EXISTS interview_questions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_key VARCHAR(120) NOT NULL UNIQUE,
  target_career VARCHAR(120) NOT NULL,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(30) NULL,
  question_text TEXT NOT NULL,
  expected_topics JSON NULL,
  is_project_question BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_interview_questions_target_career (target_career)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. interview_sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  mode VARCHAR(20) NOT NULL,
  target_career VARCHAR(120) NOT NULL,
  technical_score DECIMAL(5,2) NULL,
  problem_solving_score DECIMAL(5,2) NULL,
  communication_score DECIMAL(5,2) NULL,
  project_knowledge_score DECIMAL(5,2) NULL,
  overall_score DECIMAL(5,2) NULL,
  question_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_interview_sessions_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. interview_responses
CREATE TABLE IF NOT EXISTS interview_responses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  response_text TEXT NULL,
  technical_score DECIMAL(5,2) NULL,
  problem_solving_score DECIMAL(5,2) NULL,
  communication_score DECIMAL(5,2) NULL,
  project_knowledge_score DECIMAL(5,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_session_question (session_id, question_id),
  INDEX idx_interview_responses_session_id (session_id),
  FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES interview_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. portfolio_evidence
CREATE TABLE IF NOT EXISTS portfolio_evidence (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  project_title VARCHAR(200) NULL,
  github_repo_url VARCHAR(500) NULL,
  live_demo_url VARCHAR(500) NULL,
  project_description TEXT NULL,
  architecture_notes TEXT NULL,
  tech_stack TEXT NULL,
  proof_status VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_portfolio_evidence_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
