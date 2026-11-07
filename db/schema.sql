-- ============================================================================
-- KUTUBUKU — PostgreSQL Database Schema (DDL) & Seed Data (DML)
-- Course: Database Technology (COMP6852004) — Class BH20 — BINUS University
-- Compatible with: PostgreSQL 15+ / pgAdmin 4 / Supabase SQL Editor
-- ============================================================================

-- Enable UUID generation extension (built-in on PostgreSQL 13+ and Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLE: users
-- Stores core user profile, daily reading goals, and optional BYOK Gemini status
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_initials VARCHAR(4) NOT NULL DEFAULT 'KB',
    avatar_bg VARCHAR(20) NOT NULL DEFAULT '#4f46e5',
    daily_target_pages INT NOT NULL DEFAULT 30 CHECK (daily_target_pages > 0),
    daily_target_minutes INT DEFAULT 25 CHECK (daily_target_minutes > 0),
    has_gemini_key BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. TABLE: user_stats
-- 1-to-1 table tracking gamification metrics (Streaks, XP, Levels)
-- ============================================================================
CREATE TABLE user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    streak_days INT NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
    longest_streak INT NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    last_read_date DATE,
    total_xp INT NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    current_level INT NOT NULL DEFAULT 1 CHECK (current_level >= 1),
    xp_to_next_level INT NOT NULL DEFAULT 200 CHECK (xp_to_next_level > 0),
    today_pages_read INT NOT NULL DEFAULT 0 CHECK (today_pages_read >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. TABLE: genres
-- 3NF Lookup table for book categories/genres
-- ============================================================================
CREATE TABLE genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ============================================================================
-- 4. TABLE: books
-- Physical or digital books owned by a user in their personal shelf
-- ============================================================================
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    genre_id UUID REFERENCES genres(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    total_pages INT NOT NULL CHECK (total_pages > 0),
    current_page INT NOT NULL DEFAULT 0 CHECK (current_page >= 0 AND current_page <= total_pages),
    status VARCHAR(20) NOT NULL DEFAULT 'want_to_read'
        CHECK (status IN ('want_to_read', 'reading', 'completed')),
    cover_color VARCHAR(20) NOT NULL DEFAULT '#0f766e',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLE: reading_sessions
-- Individual reading logs submitted by users when they read a book
-- ============================================================================
CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    pages_read INT NOT NULL CHECK (pages_read > 0),
    start_page INT CHECK (start_page >= 0),
    end_page INT CHECK (end_page >= start_page),
    minutes_read INT CHECK (minutes_read > 0),
    notes TEXT,
    xp_earned INT NOT NULL DEFAULT 10 CHECK (xp_earned >= 0),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. TABLE: session_verifications
-- AI-powered reading verification to prevent fake streak farming
-- Uses user's Gemini API key to ask a reflection/comprehension question
-- ============================================================================
CREATE TABLE session_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE REFERENCES reading_sessions(id) ON DELETE CASCADE,
    ai_prompt TEXT NOT NULL,
    user_response TEXT,
    ai_feedback TEXT,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'flagged')),
    bonus_xp INT NOT NULL DEFAULT 0 CHECK (bonus_xp >= 0),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. TABLE: reading_plans
-- Weekly reading schedule header (generated manually or via Gemini AI)
-- ============================================================================
CREATE TABLE reading_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL CHECK (week_end_date >= week_start_date),
    target_pages_per_day INT NOT NULL CHECK (target_pages_per_day > 0),
    projected_weekly_pages INT NOT NULL CHECK (projected_weekly_pages > 0),
    ai_rationale TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. TABLE: reading_plan_items
-- Daily schedule breakdown assigning specific books & page targets to dates
-- ============================================================================
CREATE TABLE reading_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    target_pages INT NOT NULL CHECK (target_pages > 0),
    actual_pages_read INT NOT NULL DEFAULT 0 CHECK (actual_pages_read >= 0),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (plan_id, book_id, scheduled_date)
);

-- ============================================================================
-- 9. TABLE: badges
-- Master catalog of gamification badges and achievement milestones
-- ============================================================================
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(30) NOT NULL CHECK (icon IN ('flame', 'book', 'pages', 'target', 'star')),
    requirement_type VARCHAR(30) NOT NULL CHECK (requirement_type IN ('streak', 'pages', 'books_completed', 'xp')),
    requirement_value INT NOT NULL CHECK (requirement_value > 0),
    xp_reward INT NOT NULL DEFAULT 50
);

-- ============================================================================
-- 10. TABLE: user_badges
-- Junction table (M:N) recording which badges a user has unlocked
-- ============================================================================
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, badge_id)
);

-- ============================================================================
-- 11. TABLE: friendships
-- Social graph connecting users ("Bros") for leaderboards and activity feeds
-- ============================================================================
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'accepted'
        CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (requester_id <> addressee_id),
    UNIQUE (requester_id, addressee_id)
);

-- ============================================================================
-- 12. TABLE: session_celebrations
-- Social reactions ("Celebrate" 🎉 button in /bros feed) on reading sessions
-- ============================================================================
CREATE TABLE session_celebrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES reading_sessions(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, from_user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_books_user_status ON books(user_id, status);
CREATE INDEX idx_sessions_user_date ON reading_sessions(user_id, logged_at DESC);
CREATE INDEX idx_sessions_book ON reading_sessions(book_id);
CREATE INDEX idx_plan_items_date ON reading_plan_items(scheduled_date);
CREATE INDEX idx_friendships_users ON friendships(requester_id, addressee_id);

