-- ============================================================================
-- KUTUBUKU — Sample Seed Data (DML) & Presentation Queries
-- Course: Database Technology (COMP6852004) — Class BH20 — BINUS University
-- Run after db/schema.sql in pgAdmin 4 or Supabase SQL Editor
-- ============================================================================

-- 1. Seed Genres
INSERT INTO genres (id, name, slug, description) VALUES
    ('11111111-1111-1111-1111-111111111101', 'Self-Improvement', 'self-improvement', 'Personal growth, habits, and mindset'),
    ('11111111-1111-1111-1111-111111111102', 'Productivity', 'productivity', 'Focus, time management, and deep work'),
    ('11111111-1111-1111-1111-111111111103', 'Fiction', 'fiction', 'Literary fiction, sci-fi, and novels');

-- 2. Seed Users
INSERT INTO users (id, username, email, display_name, avatar_initials, avatar_bg, daily_target_pages, daily_target_minutes, has_gemini_key) VALUES
    ('22222222-2222-2222-2222-222222222201', 'putra_kb', 'putra@example.com', 'Putra Abyasa', 'PA', '#4f46e5', 30, 25, TRUE),
    ('22222222-2222-2222-2222-222222222202', 'stella_kb', 'stella@example.com', 'Stella Olivia', 'SO', '#0f766e', 25, 20, TRUE),
    ('22222222-2222-2222-2222-222222222203', 'ricky_kb', 'ricky@example.com', 'Ricky Satria', 'RS', '#b45309', 20, 20, FALSE);

-- 3. Seed User Stats
INSERT INTO user_stats (user_id, streak_days, longest_streak, last_read_date, total_xp, current_level, xp_to_next_level, today_pages_read) VALUES
    ('22222222-2222-2222-2222-222222222201', 5, 12, CURRENT_DATE, 420, 3, 600, 18),
    ('22222222-2222-2222-2222-222222222202', 7, 14, CURRENT_DATE, 580, 3, 600, 30),
    ('22222222-2222-2222-2222-222222222203', 3, 5, CURRENT_DATE - INTERVAL '1 day', 240, 2, 400, 0);

-- 4. Seed Books
INSERT INTO books (id, user_id, genre_id, title, author, isbn, total_pages, current_page, status, cover_color) VALUES
    ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Atomic Habits', 'James Clear', '9780735211292', 320, 164, 'reading', '#0f766e'),
    ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'Deep Work', 'Cal Newport', '9781455586691', 296, 296, 'completed', '#1e293b'),
    ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', 'Klara and the Sun', 'Kazuo Ishiguro', '9780593318171', 303, 0, 'want_to_read', '#6b21a8');

-- 5. Seed Reading Sessions
INSERT INTO reading_sessions (id, user_id, book_id, pages_read, start_page, end_page, minutes_read, notes, xp_earned, is_verified, logged_at) VALUES
    ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301', 18, 146, 164, 22, 'Great insight on habit stacking and environmental cues.', 28, TRUE, CURRENT_DATE),
    ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301', 24, 122, 146, 30, 'Finished Chapter 5 on the 2-minute rule.', 34, TRUE, CURRENT_DATE - INTERVAL '1 day'),
    ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333333301', 30, 1, 30, 25, 'Started reading Atomic Habits today!', 50, TRUE, CURRENT_DATE);

-- 6. Seed AI Session Verifications
INSERT INTO session_verifications (session_id, ai_prompt, user_response, ai_feedback, verification_status, bonus_xp, verified_at) VALUES
    ('44444444-4444-4444-4444-444444444401',
     'In pages 146-164 of Atomic Habits, how does James Clear suggest connecting a new habit to an existing daily routine?',
     'By using the habit stacking formula: After [CURRENT HABIT], I will [NEW HABIT], combined with redesigning physical environment cues.',
     'Verified! Accurate summary of habit stacking and environment design.',
     'verified', 15, NOW());

-- 7. Seed Reading Plans & Items
INSERT INTO reading_plans (id, user_id, week_start_date, week_end_date, target_pages_per_day, projected_weekly_pages, ai_rationale, status) VALUES
    ('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222201', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 days', 28, 196,
     'Based on your 22-min average sessions last week, pacing 28 pages/day finishes Atomic Habits and starts Klara and the Sun on Saturday.', 'active');

INSERT INTO reading_plan_items (plan_id, book_id, scheduled_date, target_pages, actual_pages_read, is_completed) VALUES
    ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', CURRENT_DATE, 28, 18, FALSE),
    ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', CURRENT_DATE + INTERVAL '1 day', 28, 0, FALSE),
    ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333303', CURRENT_DATE + INTERVAL '2 days', 28, 0, FALSE);

-- 8. Seed Badges & User Badges
INSERT INTO badges (id, code, title, description, icon, requirement_type, requirement_value, xp_reward) VALUES
    ('66666666-6666-6666-6666-666666666601', 'STREAK_3', '3-Day Streak', 'Maintained 3 consecutive days of reading', 'flame', 'streak', 3, 50),
    ('66666666-6666-6666-6666-666666666602', 'PAGES_100', '100 Pages Read', 'Crossed your first century of pages read', 'pages', 'pages', 100, 50),
    ('66666666-6666-6666-6666-666666666603', 'FIRST_BOOK', 'First Book Finished', 'Completed your first book cover to cover', 'book', 'books_completed', 1, 100),
    ('66666666-6666-6666-6666-666666666604', 'STREAK_7', '7-Day Master', 'Complete a full 7-day uninterrupted streak', 'target', 'streak', 7, 100),
    ('66666666-6666-6666-6666-666666666605', 'XP_500', '500 XP Explorer', 'Earn 500 total XP from consistent reading', 'star', 'xp', 500, 100);

INSERT INTO user_badges (user_id, badge_id) VALUES
    ('22222222-2222-2222-2222-222222222201', '66666666-6666-6666-6666-666666666601'),
    ('22222222-2222-2222-2222-222222222201', '66666666-6666-6666-6666-666666666602'),
    ('22222222-2222-2222-2222-222222222201', '66666666-6666-6666-6666-666666666603');

-- 9. Seed Friendships & Celebrations
INSERT INTO friendships (requester_id, addressee_id, status) VALUES
    ('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222202', 'accepted'),
    ('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222203', 'accepted');

INSERT INTO session_celebrations (session_id, from_user_id) VALUES
    ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222201');

