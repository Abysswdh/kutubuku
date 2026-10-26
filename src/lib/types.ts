export type BookStatus = 'reading' | 'completed' | 'want_to_read';

/**
 * Matches a future PostgreSQL `books` table schema.
 */
export interface Book {
	id: string; // uuid
	title: string;
	author: string;
	totalPages: number;
	currentPage: number;
	status: BookStatus;
	coverColor?: string; // clean hex or tailwind tint for cover placeholder
	genre?: string;
	createdAt: string; // ISO 8601 timestamp
	updatedAt: string; // ISO 8601 timestamp
}

/**
 * Matches a future PostgreSQL `reading_sessions` table schema.
 */
export interface ReadingSession {
	id: string; // uuid
	bookId: string; // foreign key -> books.id
	pagesRead: number;
	minutesRead?: number | null;
	notes?: string | null;
	xpEarned: number;
	loggedAt: string; // ISO 8601 date string (e.g. 2026-10-26)
	createdAt: string; // ISO 8601 timestamp
}

/**
 * Matches a future PostgreSQL `daily_goals` table schema.
 */
export interface DailyGoal {
	id: string; // uuid
	targetPages: number;
	targetMinutes?: number | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * Matches a future PostgreSQL `user_stats` table schema.
 */
export interface UserStats {
	id: string; // uuid
	streakDays: number;
	lastReadDate: string | null; // YYYY-MM-DD
	totalXp: number;
	currentLevel: number;
	xpToNextLevel: number; // XP threshold for next level tier
	todayPagesRead: number;
	createdAt: string;
	updatedAt: string;
}

/**
 * Day status for the weekly habit strip.
 */
export interface WeekDayLog {
	date: string; // YYYY-MM-DD
	dayLabel: string; // e.g. 'M', 'T', 'W'
	dayName: string; // e.g. 'Mon', 'Tue'
	pagesRead: number;
	hasLogged: boolean;
	isToday: boolean;
}

/**
 * Payload for logging a new session.
 */
export interface LogSessionInput {
	bookId: string;
	pagesRead: number;
	minutesRead?: number;
	notes?: string;
}

/**
 * Result returned after logging a session.
 */
export interface LogSessionResult {
	session: ReadingSession;
	xpEarned: number;
	newStreak: number;
	totalXp: number;
	currentLevel: number;
	bookUpdated: Book;
}
