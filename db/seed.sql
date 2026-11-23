-- ============================================================================
-- KUTUBUKU — Sample Seed Data (DML) for the 15-Table Schema
-- Compatible with: Supabase SQL Editor & pgAdmin 4
-- ============================================================================

-- 1. Publishers
INSERT INTO publisher (publisherID, publisherName) VALUES
    ('PU00000001', 'Penguin Random House'),
    ('PU00000002', 'Grand Central Publishing'),
    ('PU00000003', 'Faber & Faber'),
    ('PU00000004', 'Farrar, Straus and Giroux');

-- 2. Authors
INSERT INTO author (authorID, authorName, biography, birthDate, nationality) VALUES
    ('AU00000001', 'James Clear', 'Author and speaker focused on habits, decision making, and continuous improvement.', '1986-01-22', 'American'),
    ('AU00000002', 'Cal Newport', 'Computer science professor at Georgetown University and productivity writer.', '1982-06-23', 'American'),
    ('AU00000003', 'Kazuo Ishiguro', 'Nobel Prize-winning British novelist.', '1954-11-08', 'British'),
    ('AU00000004', 'Daniel Kahneman', 'Nobel Memorial Prize winner in Economic Sciences and psychologist.', '1934-03-05', 'Israeli-American');

-- 3. Genres
INSERT INTO genre (genreID, genreName) VALUES
    ('GN00000001', 'Self-Improvement'),
    ('GN00000002', 'Productivity'),
    ('GN00000003', 'Fiction'),
    ('GN00000004', 'Science Fiction'),
    ('GN00000005', 'Psychology');

-- 4. Books
INSERT INTO book (bookID, publisherID, title, isbn13, publishDate, pageCount, description) VALUES
    ('BK00000001', 'PU00000001', 'Atomic Habits', '9780735211292', '2018-10-16', 320, 'An Easy & Proven Way to Build Good Habits & Break Bad Ones.'),
    ('BK00000002', 'PU00000002', 'Deep Work', '9781455586691', '2016-01-05', 296, 'Rules for Focused Success in a Distracted World.'),
    ('BK00000003', 'PU00000003', 'Klara and the Sun', '9780593318171', '2021-03-02', 303, 'A thrilling book that offers a look at our changing world through the eyes of an unforgettable narrator.'),
    ('BK00000004', 'PU00000004', 'Thinking, Fast and Slow', '9780374533557', '2011-10-25', 499, 'Explores the two systems that drive the way we think.');

-- 5. Book Authors (M:N)
INSERT INTO book_author (bookID, authorID) VALUES
    ('BK00000001', 'AU00000001'),
    ('BK00000002', 'AU00000002'),
    ('BK00000003', 'AU00000003'),
    ('BK00000004', 'AU00000004');

-- 6. Book Genres (M:N)
INSERT INTO book_genre (bookID, genreID) VALUES
    ('BK00000001', 'GN00000001'),
    ('BK00000001', 'GN00000002'),
    ('BK00000002', 'GN00000002'),
    ('BK00000003', 'GN00000003'),
    ('BK00000003', 'GN00000004'),
    ('BK00000004', 'GN00000005');

-- 7. App Users
INSERT INTO app_user (userID, userName, userEmail, passwordHash, registerDate, timezone, maxConcurrentBooks, currentStreak, longestStreak, lastActivityDate) VALUES
    ('US00000001', 'Putra Abyasa', 'putra@example.com', '$2b$10$demoHashPutra', '2026-09-01', 'Asia/Jakarta', 3, 5, 12, CURRENT_DATE),
    ('US00000002', 'Stella Olivia', 'stella@example.com', '$2b$10$demoHashStella', '2026-09-05', 'Asia/Jakarta', 3, 7, 14, CURRENT_DATE),
    ('US00000003', 'Ricky Satria', 'ricky@example.com', '$2b$10$demoHashRicky', '2026-09-10', 'Asia/Jakarta', 2, 3, 5, CURRENT_DATE - INTERVAL '1 day');

-- 8. User Books (Personal Shelf — including a dropped book with dropReason = 'too_many_books')
INSERT INTO user_book (userBookID, userID, bookID, status, currentPage, startDate, endDate, dropReason) VALUES
    ('UB00000001', 'US00000001', 'BK00000001', 'reading', 164, '2026-10-01', NULL, NULL),
    ('UB00000002', 'US00000001', 'BK00000002', 'finished', 296, '2026-09-15', '2026-10-20', NULL),
    ('UB00000003', 'US00000001', 'BK00000003', 'planned', 0, NULL, NULL, NULL),
    ('UB00000004', 'US00000001', 'BK00000004', 'dropped', 62, '2026-09-02', '2026-09-19', 'too_many_books'),
    ('UB00000005', 'US00000002', 'BK00000001', 'reading', 30, '2026-10-25', NULL, NULL);

-- 9. Progress Logs (Reading Sessions — enforces currentPage = startPage + pagesRead)
INSERT INTO progress_log (progressLogID, userBookID, logDate, startPage, pagesRead, currentPage, minutesRead, note) VALUES
    ('PL00000001', 'UB00000001', CURRENT_DATE - INTERVAL '4 days', 55, 15, 70, 20, 'Started reading the introduction.'),
    ('PL00000002', 'UB00000001', CURRENT_DATE - INTERVAL '3 days', 70, 20, 90, 25, 'Fundamentals of compounding small improvements.'),
    ('PL00000003', 'UB00000001', CURRENT_DATE - INTERVAL '2 days', 90, 32, 122, 40, 'Identity-based habits resonate strongly.'),
    ('PL00000004', 'UB00000001', CURRENT_DATE - INTERVAL '1 day', 122, 24, 146, 30, 'Finished Chapter 5 on the 2-minute rule.'),
    ('PL00000005', 'UB00000001', CURRENT_DATE, 146, 18, 164, 22, 'Great insight on habit stacking and environmental cues.');

-- 10. Reading Schedules
INSERT INTO reading_schedule (scheduleID, userBookID, startDate, targetFinishDate, pagesPerDayTarget, estimatedPagesPerDay, predictedFinishDate, status) VALUES
    ('RS00000001', 'UB00000001', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 days', 28, 26.50, CURRENT_DATE + INTERVAL '6 days', 'active');

-- 11. Schedule Reading Days (Days of week 1..7)
INSERT INTO schedule_reading_day (scheduleID, dayOfWeek) VALUES
    ('RS00000001', 1),
    ('RS00000001', 2),
    ('RS00000001', 3),
    ('RS00000001', 4),
    ('RS00000001', 5),
    ('RS00000001', 6),
    ('RS00000001', 7);

-- 12. Schedule Days (Concrete daily targets)
INSERT INTO schedule_day (scheduleDayID, scheduleID, scheduledDate, targetPages, status) VALUES
    ('SD00000001', 'RS00000001', CURRENT_DATE - INTERVAL '2 days', 28, 'completed'),
    ('SD00000002', 'RS00000001', CURRENT_DATE - INTERVAL '1 day', 28, 'completed'),
    ('SD00000003', 'RS00000001', CURRENT_DATE, 28, 'pending'),
    ('SD00000004', 'RS00000001', CURRENT_DATE + INTERVAL '1 day', 28, 'pending');

-- 13. Badges
INSERT INTO badge (badgeID, badgeName, description, iconURL, criteriaType, criteriaValue) VALUES
    ('BD00000001', '3-Day Streak', 'Maintained 3 consecutive days of reading', 'flame', 'streak_days', 3),
    ('BD00000002', '100 Pages Read', 'Crossed your first century of pages read', 'pages', 'pages_read', 100),
    ('BD00000003', 'First Book Finished', 'Completed your first book cover to cover', 'book', 'books_finished', 1),
    ('BD00000004', '7-Day Master', 'Complete a full 7-day uninterrupted streak', 'target', 'streak_days', 7),
    ('BD00000005', '500 Pages Club', 'Read 500 cumulative pages across your shelf', 'star', 'pages_read', 500);

-- 14. User Badges (M:N)
INSERT INTO user_badge (userID, badgeID) VALUES
    ('US00000001', 'BD00000001'),
    ('US00000001', 'BD00000002'),
    ('US00000001', 'BD00000003'),
    ('US00000002', 'BD00000001'),
    ('US00000002', 'BD00000004');

-- 15. Reading Challenges
INSERT INTO reading_challenge (challengeID, userID, challengeYear, targetBooks, targetPages) VALUES
    ('RC00000001', 'US00000001', 2026, 12, 3600),
    ('RC00000002', 'US00000002', 2026, 15, 4500);
