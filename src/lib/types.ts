export type BookStatus = 'reading' | 'completed' | 'want_to_read';

/**
 * Maps directly to a future PostgreSQL `books` table.
 */
export interface Book {
	id: string; // uuid
	title: string;
	author: string;
	totalPages: number;
	currentPage: number;
	status: BookStatus;
	coverColor?: string; // Hex tint fallback
	genre?: string;
	createdAt: string; // ISO 8601
	updatedAt: string; // ISO 8601
}

/**
 * Maps directly to a future PostgreSQL `reading_sessions` table.
 */
export interface ReadingSession {
	id: string; // uuid
	bookId: string; // foreign key -> books.id
	pagesRead: number;
	minutesRead?: number | null;
	notes?: string | null;
	xpEarned: number;
	loggedAt: string; // YYYY-MM-DD
	createdAt: string; // ISO 8601
}

/**
 * Maps directly to a future PostgreSQL `daily_goals` table.
 */
export interface DailyGoal {
	id: string; // uuid
	targetPages: number;
	targetMinutes?: number | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * Maps directly to a future PostgreSQL `user_stats` table.
 */
export interface UserStats {
	id: string; // uuid
	streakDays: number;
	lastReadDate: string | null; // YYYY-MM-DD
	totalXp: number;
	currentLevel: number;
	xpToNextLevel: number;
	todayPagesRead: number;
	createdAt: string;
	updatedAt: string;
}

/**
 * Represents a single day in the 7-day habit strip.
 */
export interface WeekDayLog {
	date: string; // YYYY-MM-DD
	dayLabel: string; // 'M', 'T', 'W', etc.
	dayName: string; // 'Mon', 'Tue', etc.
	pagesRead: number;
	hasLogged: boolean;
	isToday: boolean;
}

/**
 * Reading achievement badges.
 */
export interface Badge {
	id: string;
	title: string;
	description: string;
	icon: 'flame' | 'book' | 'pages' | 'target' | 'star';
	isUnlocked: boolean;
	unlockedAt?: string;
}

/**
 * AI-generated weekly reading plan preview for desktop companion panel.
 */
export interface WeeklyPlanPreview {
	targetPagesPerDay: number;
	recommendedBookTitle: string;
	rationale: string;
	projectedWeeklyPages: number;
}

/**
 * Payload sent when logging a session.
 */
export interface LogSessionInput {
	bookId: string;
	pagesRead: number;
	minutesRead?: number;
	notes?: string;
}

/**
 * Mutation result returned to the client.
 */
export interface LogSessionResult {
	session: ReadingSession;
	xpEarned: number;
	newStreak: number;
	totalXp: number;
	currentLevel: number;
	bookUpdated: Book;
	isGoalNewlyMet: boolean;
}
