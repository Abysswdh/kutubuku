-- ============================================================================
-- KUTUBUKU — 15-Table PostgreSQL Schema (Supabase & pgAdmin 4 Compatible)
-- Course: Database Technology (COMP6852004) — Class BH20 — BINUS University
-- How to use on Supabase:
--   1. Open Supabase Dashboard -> SQL Editor -> New Query
--   2. Paste this entire file and click "Run"
-- ============================================================================

CREATE TABLE publisher
(
    publisherID CHAR( 10 ) CHECK ( publisherID ~ '^PU\d{8}$' ),
    publisherName VARCHAR( 255 ) NOT NULL,

    PRIMARY KEY( publisherID )
);

CREATE TABLE author
(
    authorID CHAR( 10 ) CHECK ( authorID ~ '^AU\d{8}$' ),
    authorName VARCHAR( 100 ) NOT NULL,
    biography TEXT,
    birthDate DATE,
    nationality VARCHAR( 100 ),

    PRIMARY KEY( authorID )
);

CREATE TABLE genre
(
    genreID CHAR( 10 ) CHECK ( genreID ~ '^GN\d{8}$' ),
    genreName VARCHAR( 100 ) NOT NULL UNIQUE,

    PRIMARY KEY( genreID )
);

CREATE TABLE book
(
    bookID CHAR( 10 ) CHECK ( bookID ~ '^BK\d{8}$' ),
    publisherID CHAR( 10 ),
    title VARCHAR( 255 ) NOT NULL,
    isbn13 CHAR( 13 ) UNIQUE CHECK ( isbn13 ~ '^\d{13}$' ),
    publishDate DATE,
    pageCount INT NOT NULL CHECK ( pageCount > 0 ),
    description TEXT,

    PRIMARY KEY( bookID ),
    FOREIGN KEY( publisherID ) REFERENCES publisher( publisherID )
);

CREATE TABLE book_author
(
    bookID CHAR( 10 ),
    authorID CHAR( 10 ),

    PRIMARY KEY( bookID, authorID ),
    FOREIGN KEY( bookID ) REFERENCES book( bookID ) ON DELETE CASCADE,
    FOREIGN KEY( authorID ) REFERENCES author( authorID ) ON DELETE CASCADE
);

CREATE TABLE book_genre
(
    bookID CHAR( 10 ),
    genreID CHAR( 10 ),

    PRIMARY KEY( bookID, genreID ),
    FOREIGN KEY( bookID ) REFERENCES book( bookID ) ON DELETE CASCADE,
    FOREIGN KEY( genreID ) REFERENCES genre( genreID ) ON DELETE CASCADE
);

CREATE TABLE app_user
(
    userID CHAR( 10 ) CHECK ( userID ~ '^US\d{8}$' ),
    userName VARCHAR( 100 ) NOT NULL,
    userEmail VARCHAR( 100 ) NOT NULL UNIQUE,
    passwordHash VARCHAR( 255 ) NOT NULL,
    registerDate DATE NOT NULL DEFAULT CURRENT_DATE,

    timezone VARCHAR( 50 ) NOT NULL DEFAULT 'Asia/Jakarta',
    maxConcurrentBooks INT NOT NULL DEFAULT 3 CHECK ( maxConcurrentBooks > 0 ),

    currentStreak INT NOT NULL DEFAULT 0 CHECK ( currentStreak >= 0 ),
    longestStreak INT NOT NULL DEFAULT 0 CHECK ( longestStreak >= 0 ),
    lastActivityDate DATE,

    PRIMARY KEY( userID ),
    CHECK ( longestStreak >= currentStreak )
);

CREATE TABLE user_book
(
    userBookID CHAR( 10 ) CHECK ( userBookID ~ '^UB\d{8}$' ),
    userID CHAR( 10 ) NOT NULL,
    bookID CHAR( 10 ) NOT NULL,
    status VARCHAR( 20 ) NOT NULL DEFAULT 'planned'
        CHECK ( status IN ( 'planned', 'reading', 'paused', 'finished', 'dropped' ) ),
    currentPage INT NOT NULL DEFAULT 0 CHECK ( currentPage >= 0 ),
    startDate DATE,
    endDate DATE,
    dropReason VARCHAR( 20 )
        CHECK ( dropReason IN ( 'too_many_books', 'overwhelmed', 'lost_interest', 'other' ) ),
    addedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY( userBookID ),
    FOREIGN KEY( userID ) REFERENCES app_user( userID ) ON DELETE CASCADE,
    FOREIGN KEY( bookID ) REFERENCES book( bookID ),
    CHECK ( startDate IS NULL OR endDate IS NULL OR endDate >= startDate ),
    CHECK ( dropReason IS NULL OR status = 'dropped' )
);

CREATE UNIQUE INDEX uq_active_user_book
ON user_book( userID, bookID )
WHERE status IN ( 'planned', 'reading', 'paused' );

CREATE TABLE progress_log
(
    progressLogID CHAR( 10 ) CHECK ( progressLogID ~ '^PL\d{8}$' ),
    userBookID CHAR( 10 ) NOT NULL,
    logDate DATE NOT NULL,
    startPage INT NOT NULL CHECK ( startPage >= 0 ),
    pagesRead INT NOT NULL CHECK ( pagesRead > 0 ),
    currentPage INT NOT NULL CHECK ( currentPage > 0 ),
    minutesRead INT CHECK ( minutesRead > 0 ),
    note TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY( progressLogID ),
    FOREIGN KEY( userBookID ) REFERENCES user_book( userBookID ) ON DELETE CASCADE,
    CHECK ( currentPage = startPage + pagesRead )
);

CREATE TABLE reading_schedule
(
    scheduleID CHAR( 10 ) CHECK ( scheduleID ~ '^RS\d{8}$' ),
    userBookID CHAR( 10 ) NOT NULL,
    startDate DATE NOT NULL DEFAULT CURRENT_DATE,
    targetFinishDate DATE NOT NULL,
    pagesPerDayTarget INT NOT NULL CHECK ( pagesPerDayTarget > 0 ),

    estimatedPagesPerDay NUMERIC( 6, 2 ) CHECK ( estimatedPagesPerDay >= 0 ),
    predictedFinishDate DATE,

    status VARCHAR( 20 ) NOT NULL DEFAULT 'active'
        CHECK ( status IN ( 'active', 'completed', 'cancelled' ) ),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY( scheduleID ),
    FOREIGN KEY( userBookID ) REFERENCES user_book( userBookID ) ON DELETE CASCADE,
    CHECK ( targetFinishDate >= startDate )
);

CREATE UNIQUE INDEX uq_active_reading_schedule
ON reading_schedule( userBookID )
WHERE status = 'active';

CREATE TABLE schedule_reading_day
(
    scheduleID CHAR( 10 ),
    dayOfWeek SMALLINT CHECK ( dayOfWeek BETWEEN 1 AND 7 ),

    PRIMARY KEY( scheduleID, dayOfWeek ),
    FOREIGN KEY( scheduleID ) REFERENCES reading_schedule( scheduleID ) ON DELETE CASCADE
);

CREATE TABLE schedule_day
(
    scheduleDayID CHAR( 10 ) CHECK ( scheduleDayID ~ '^SD\d{8}$' ),
    scheduleID CHAR( 10 ) NOT NULL,
    scheduledDate DATE NOT NULL,
    targetPages INT NOT NULL CHECK ( targetPages > 0 ),
    status VARCHAR( 20 ) NOT NULL DEFAULT 'pending'
        CHECK ( status IN ( 'pending', 'completed', 'missed' ) ),

    PRIMARY KEY( scheduleDayID ),
    FOREIGN KEY( scheduleID ) REFERENCES reading_schedule( scheduleID ) ON DELETE CASCADE,
    UNIQUE( scheduleID, scheduledDate )
);

CREATE TABLE badge
(
    badgeID CHAR( 10 ) CHECK ( badgeID ~ '^BD\d{8}$' ),
    badgeName VARCHAR( 100 ) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    iconURL VARCHAR( 255 ),
    criteriaType VARCHAR( 20 ) NOT NULL
        CHECK ( criteriaType IN ( 'streak_days', 'books_finished', 'pages_read' ) ),
    criteriaValue INT NOT NULL CHECK ( criteriaValue > 0 ),

    PRIMARY KEY( badgeID ),
    UNIQUE( criteriaType, criteriaValue )
);

CREATE TABLE user_badge
(
    userID CHAR( 10 ),
    badgeID CHAR( 10 ),
    awardedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY( userID, badgeID ),
    FOREIGN KEY( userID ) REFERENCES app_user( userID ) ON DELETE CASCADE,
    FOREIGN KEY( badgeID ) REFERENCES badge( badgeID ) ON DELETE CASCADE
);

CREATE TABLE reading_challenge
(
    challengeID CHAR( 10 ) CHECK ( challengeID ~ '^RC\d{8}$' ),
    userID CHAR( 10 ) NOT NULL,
    challengeYear INT NOT NULL CHECK ( challengeYear >= 2000 ),
    targetBooks INT CHECK ( targetBooks > 0 ),
    targetPages INT CHECK ( targetPages > 0 ),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY( challengeID ),
    FOREIGN KEY( userID ) REFERENCES app_user( userID ) ON DELETE CASCADE,
    UNIQUE( userID, challengeYear ),
    CHECK ( targetBooks IS NOT NULL OR targetPages IS NOT NULL )
);

CREATE INDEX idx_user_book_user_status ON user_book( userID, status );
CREATE INDEX idx_progress_log_userbook_date ON progress_log( userBookID, logDate );
CREATE INDEX idx_schedule_day_date ON schedule_day( scheduledDate, status );

-- ============================================================================
-- Social Bookmates Extension (Friends / Following + Activity Celebrations)
-- ============================================================================

CREATE TABLE user_bookmate
(
    userID CHAR( 10 ) NOT NULL,
    mateUserID CHAR( 10 ) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY( userID, mateUserID ),
    FOREIGN KEY( userID ) REFERENCES app_user( userID ) ON DELETE CASCADE,
    FOREIGN KEY( mateUserID ) REFERENCES app_user( userID ) ON DELETE CASCADE,
    CHECK ( userID <> mateUserID )
);

CREATE TABLE bookmate_celebration
(
    userID CHAR( 10 ) NOT NULL,
    activityKey VARCHAR( 64 ) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY( userID, activityKey ),
    FOREIGN KEY( userID ) REFERENCES app_user( userID ) ON DELETE CASCADE
);

CREATE INDEX idx_user_bookmate_mate ON user_bookmate( mateUserID );
CREATE INDEX idx_bookmate_celebration_key ON bookmate_celebration( activityKey );
