-- ============================================
-- EduConnect Database Schema
-- PostgreSQL 14+
-- ============================================

-- Drop existing tables if they exist (cascade to handle foreign keys)
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS exercise_attempts CASCADE;
DROP TABLE IF EXISTS exercise_questions CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS lesson_completions CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS activity_history CASCADE;
DROP TABLE IF EXISTS leaderboard_cache CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(10) DEFAULT '👤',
    
    -- Gamification fields
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    streak INTEGER DEFAULT 0 CHECK (streak >= 0),
    last_login_date DATE,
    total_study_time INTEGER DEFAULT 0, -- in minutes
    
    -- Progress by subject (stored as percentages 0-100)
    math_progress INTEGER DEFAULT 0 CHECK (math_progress >= 0 AND math_progress <= 100),
    french_progress INTEGER DEFAULT 0 CHECK (french_progress >= 0 AND french_progress <= 100),
    science_progress INTEGER DEFAULT 0 CHECK (science_progress >= 0 AND science_progress <= 100),
    history_progress INTEGER DEFAULT 0 CHECK (history_progress >= 0 AND history_progress <= 100),
    
    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_xp ON users(xp DESC);
CREATE INDEX idx_users_level ON users(level DESC);
CREATE INDEX idx_users_last_login ON users(last_login_date);

-- ============================================
-- REFRESH TOKENS TABLE
-- ============================================
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    replaced_by_token VARCHAR(500)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================
-- SUBJECTS TABLE
-- ============================================
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key VARCHAR(50) UNIQUE NOT NULL, -- math, french, science, history
    description TEXT,
    emoji VARCHAR(10),
    color_from VARCHAR(50),
    color_to VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_key ON subjects(key);

-- ============================================
-- CHAPTERS TABLE
-- ============================================
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    order_index INTEGER DEFAULT 0,
    estimated_duration INTEGER, -- in minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chapters_subject ON chapters(subject_id);

-- ============================================
-- LESSONS TABLE
-- ============================================
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    estimated_duration INTEGER, -- in minutes
    xp_reward INTEGER DEFAULT 10,
    video_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lessons_chapter ON lessons(chapter_id);

-- ============================================
-- LESSON COMPLETIONS TABLE
-- ============================================
CREATE TABLE lesson_completions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_spent INTEGER, -- in seconds
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_lesson_completions_user ON lesson_completions(user_id);
CREATE INDEX idx_lesson_completions_lesson ON lesson_completions(lesson_id);

-- ============================================
-- QUIZZES TABLE
-- ============================================
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_duration INTEGER, -- in minutes
    xp_base_reward INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quizzes_subject ON quizzes(subject_id);
CREATE INDEX idx_quizzes_difficulty ON quizzes(difficulty);

-- ============================================
-- QUIZ QUESTIONS TABLE
-- ============================================
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_option INTEGER NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
    explanation TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- ============================================
-- QUIZ ATTEMPTS TABLE
-- ============================================
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL,
    percentage INTEGER GENERATED ALWAYS AS (CASE WHEN total_questions > 0 THEN (score * 100 / total_questions) ELSE 0 END) STORED,
    xp_earned INTEGER DEFAULT 0,
    time_spent INTEGER, -- in seconds
    answers JSONB, -- Store user answers as JSON array
    is_first_attempt BOOLEAN DEFAULT false,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_completed ON quiz_attempts(completed_at DESC);

-- ============================================
-- EXERCISES TABLE
-- ============================================
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    xp_reward INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exercises_subject ON exercises(subject_id);

-- ============================================
-- EXERCISE QUESTIONS TABLE
-- ============================================
CREATE TABLE exercise_questions (
    id SERIAL PRIMARY KEY,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    emoji VARCHAR(10),
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_option INTEGER NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
    explanation TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exercise_questions_exercise ON exercise_questions(exercise_id);

-- ============================================
-- EXERCISE ATTEMPTS TABLE
-- ============================================
CREATE TABLE exercise_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exercise_attempts_user ON exercise_attempts(user_id);
CREATE INDEX idx_exercise_attempts_exercise ON exercise_attempts(exercise_id);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10),
    category VARCHAR(50), -- lesson, quiz, exercise, streak, special
    requirement_type VARCHAR(50), -- count, score, streak, etc.
    requirement_value INTEGER,
    xp_bonus INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievements_key ON achievements(key);
CREATE INDEX idx_achievements_category ON achievements(category);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);

-- ============================================
-- ACTIVITY HISTORY TABLE
-- ============================================
CREATE TABLE activity_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- quiz, lesson, exercise, achievement
    activity_title VARCHAR(255) NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    metadata JSONB, -- Additional data like score, quiz_id, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_history_user ON activity_history(user_id);
CREATE INDEX idx_activity_history_type ON activity_history(activity_type);
CREATE INDEX idx_activity_history_created ON activity_history(created_at DESC);

-- ============================================
-- LEADERBOARD CACHE TABLE (for performance)
-- ============================================
CREATE TABLE leaderboard_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leaderboard_type VARCHAR(50) NOT NULL, -- global, math, french, etc.
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL, -- XP or subject-specific score
    league VARCHAR(20), -- bronze, silver, gold, diamond
    trend VARCHAR(10), -- up, down, same
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, leaderboard_type)
);

CREATE INDEX idx_leaderboard_cache_type ON leaderboard_cache(leaderboard_type);
CREATE INDEX idx_leaderboard_cache_rank ON leaderboard_cache(rank);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: User Stats
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.avatar,
    u.xp,
    u.level,
    u.streak,
    CASE 
        WHEN u.level >= 10 THEN 'diamond'
        WHEN u.level >= 7 THEN 'gold'
        WHEN u.level >= 4 THEN 'silver'
        ELSE 'bronze'
    END AS league,
    (u.xp % 100) AS current_level_xp,
    100 AS xp_needed_for_next_level,
    COUNT(DISTINCT lc.id) AS lessons_completed,
    COUNT(DISTINCT qa.id) AS quizzes_completed,
    COUNT(DISTINCT ea.id) AS exercises_completed,
    COUNT(DISTINCT ua.id) AS achievements_earned,
    COALESCE(AVG(qa.percentage), 0) AS avg_quiz_score,
    u.total_study_time,
    u.last_login_date,
    u.created_at
FROM users u
LEFT JOIN lesson_completions lc ON u.id = lc.user_id
LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
LEFT JOIN exercise_attempts ea ON u.id = ea.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
GROUP BY u.id;

-- View: Global Leaderboard
CREATE OR REPLACE VIEW global_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY xp DESC, level DESC) AS rank,
    id,
    username,
    avatar,
    xp,
    level,
    CASE 
        WHEN level >= 10 THEN 'diamond'
        WHEN level >= 7 THEN 'gold'
        WHEN level >= 4 THEN 'silver'
        ELSE 'bronze'
    END AS league,
    streak,
    last_login_date
FROM users
WHERE is_active = true
ORDER BY xp DESC, level DESC;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE users IS 'Main users table with gamification fields';
COMMENT ON TABLE quizzes IS 'Quiz templates with metadata';
COMMENT ON TABLE quiz_questions IS 'Questions belonging to quizzes';
COMMENT ON TABLE quiz_attempts IS 'User attempts at quizzes with scores';
COMMENT ON TABLE achievements IS 'Available achievements in the system';
COMMENT ON TABLE user_achievements IS 'Achievements earned by users';
COMMENT ON TABLE activity_history IS 'Timeline of user activities for dashboard';
COMMENT ON TABLE leaderboard_cache IS 'Cached leaderboard data for performance';

-- ============================================
-- INITIAL ADMIN USER (password: Admin123!)
-- ============================================
-- Password hash for "Admin123!" using bcrypt
INSERT INTO users (username, email, password_hash, xp, level, avatar, is_verified)
VALUES ('admin', 'admin@educonnect.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIx3CjKbRm', 500, 6, '👑', true);
