-- ============================================================================
-- KUTUBUKU — Report & Presentation SQL Queries (Laporan & PPT Deliverable)
-- Course: Database Technology (COMP6852004) — Class BH20 — BINUS University
-- Run these in Supabase SQL Editor or pgAdmin 4 after schema.sql & seed.sql
-- ============================================================================

-- ============================================================================
-- QUERY 1: Full Personal Book Shelf with Multi-Table 3NF JOINs
-- Joins 7 tables: user_book, app_user, book, publisher, book_author, author, book_genre, genre
-- ============================================================================
SELECT
    ub.userBookID,
    u.userName AS reader_name,
    b.title AS book_title,
    p.publisherName AS publisher,
    string_agg(DISTINCT a.authorName, ', ') AS authors,
    string_agg(DISTINCT g.genreName, ', ') AS genres,
    ub.status AS shelf_status,
    ub.currentPage || ' / ' || b.pageCount AS page_progress,
    ROUND((ub.currentPage::NUMERIC / b.pageCount) * 100, 1) AS completion_percentage,
    ub.dropReason
FROM user_book ub
JOIN app_user u ON u.userID = ub.userID
JOIN book b ON b.bookID = ub.bookID
LEFT JOIN publisher p ON p.publisherID = b.publisherID
LEFT JOIN book_author ba ON ba.bookID = b.bookID
LEFT JOIN author a ON a.authorID = ba.authorID
LEFT JOIN book_genre bg ON bg.bookID = b.bookID
LEFT JOIN genre g ON g.genreID = bg.genreID
WHERE ub.userID = 'US00000001'
GROUP BY ub.userBookID, u.userName, b.title, p.publisherName, ub.status, ub.currentPage, b.pageCount, ub.dropReason
ORDER BY ub.addedAt DESC;

-- ============================================================================
-- QUERY 2: Tsundoku & Concurrency Limit Check
-- Compares each user's active 'reading' books against their maxConcurrentBooks limit
-- ============================================================================
SELECT
    u.userID,
    u.userName,
    u.maxConcurrentBooks AS max_allowed_active_books,
    COUNT(ub.userBookID) FILTER (WHERE ub.status = 'reading') AS current_active_books,
    COUNT(ub.userBookID) FILTER (WHERE ub.status = 'planned') AS planned_backlog,
    COUNT(ub.userBookID) FILTER (WHERE ub.status = 'dropped') AS dropped_books,
    CASE
        WHEN COUNT(ub.userBookID) FILTER (WHERE ub.status = 'reading') >= u.maxConcurrentBooks
        THEN 'LIMIT REACHED (Cannot start new book)'
        ELSE 'AVAILABLE SLOT'
    END AS concurrency_status
FROM app_user u
LEFT JOIN user_book ub ON ub.userID = u.userID
GROUP BY u.userID, u.userName, u.maxConcurrentBooks
ORDER BY current_active_books DESC;

-- ============================================================================
-- QUERY 3: Reading Velocity & Pacing Analytics (progress_log + book)
-- Calculates average pages/session, average minutes/session, and reading speed (pages/hour)
-- ============================================================================
SELECT
    u.userName,
    b.title AS book_title,
    COUNT(pl.progressLogID) AS total_sessions_logged,
    SUM(pl.pagesRead) AS total_pages_logged,
    SUM(pl.minutesRead) AS total_minutes_spent,
    ROUND(AVG(pl.pagesRead), 1) AS avg_pages_per_session,
    ROUND((SUM(pl.pagesRead)::NUMERIC / NULLIF(SUM(pl.minutesRead), 0)) * 60, 1) AS avg_pages_per_hour
FROM progress_log pl
JOIN user_book ub ON ub.userBookID = pl.userBookID
JOIN app_user u ON u.userID = ub.userID
JOIN book b ON b.bookID = ub.bookID
GROUP BY u.userName, b.title;

-- ============================================================================
-- QUERY 4: Weekly Reading Schedule vs. Actual Daily Progress
-- Joins reading_schedule, schedule_day, user_book, book, and progress_log
-- ============================================================================
SELECT
    rs.scheduleID,
    b.title AS scheduled_book,
    sd.scheduledDate,
    sd.targetPages AS daily_target_pages,
    COALESCE(SUM(pl.pagesRead), 0) AS actual_pages_read,
    sd.status AS schedule_day_status
FROM reading_schedule rs
JOIN user_book ub ON ub.userBookID = rs.userBookID
JOIN book b ON b.bookID = ub.bookID
JOIN schedule_day sd ON sd.scheduleID = rs.scheduleID
LEFT JOIN progress_log pl
    ON pl.userBookID = ub.userBookID
   AND pl.logDate = sd.scheduledDate
WHERE rs.status = 'active'
GROUP BY rs.scheduleID, b.title, sd.scheduledDate, sd.targetPages, sd.status
ORDER BY sd.scheduledDate ASC;

-- ============================================================================
-- QUERY 5: Annual Reading Challenge Progress Report (reading_challenge)
-- Evaluates percentage toward yearly book & page goals
-- ============================================================================
SELECT
    u.userName,
    rc.challengeYear,
    COUNT(ub.userBookID) FILTER (WHERE ub.status = 'finished') AS books_completed,
    rc.targetBooks AS book_goal,
    ROUND(
        (COUNT(ub.userBookID) FILTER (WHERE ub.status = 'finished')::NUMERIC / NULLIF(rc.targetBooks, 0)) * 100,
        1
    ) AS book_goal_percent,
    COALESCE(SUM(ub.currentPage), 0) AS total_pages_read,
    rc.targetPages AS page_goal,
    ROUND(
        (COALESCE(SUM(ub.currentPage), 0)::NUMERIC / NULLIF(rc.targetPages, 0)) * 100,
        1
    ) AS page_goal_percent
FROM reading_challenge rc
JOIN app_user u ON u.userID = rc.userID
LEFT JOIN user_book ub ON ub.userID = u.userID
GROUP BY u.userName, rc.challengeYear, rc.targetBooks, rc.targetPages;

-- ============================================================================
-- QUERY 6: Gamification Leaderboard & Unlocked Badges Summary
-- Ranks users by currentStreak, longestStreak, and total badges earned
-- ============================================================================
SELECT
    u.userID,
    u.userName,
    u.currentStreak,
    u.longestStreak,
    COUNT(ubg.badgeID) AS unlocked_badges_count,
    COALESCE(string_agg(bd.badgeName, ', ' ORDER BY ubg.awardedAt), 'No badges yet') AS earned_badges
FROM app_user u
LEFT JOIN user_badge ubg ON ubg.userID = u.userID
LEFT JOIN badge bd ON bd.badgeID = ubg.badgeID
GROUP BY u.userID, u.userName, u.currentStreak, u.longestStreak
ORDER BY u.currentStreak DESC, unlocked_badges_count DESC;

-- ============================================================================
-- QUERY 7: Tsundoku Drop Reason Analysis (Why Readers Abandon Books)
-- Aggregates dropped books by dropReason to prove the problem statement with data
-- ============================================================================
SELECT
    ub.dropReason,
    COUNT(ub.userBookID) AS dropped_count,
    ROUND(AVG(ub.currentPage::NUMERIC / b.pageCount) * 100, 1) AS avg_dropped_at_percentage
FROM user_book ub
JOIN book b ON b.bookID = ub.bookID
WHERE ub.status = 'dropped'
GROUP BY ub.dropReason
ORDER BY dropped_count DESC;
