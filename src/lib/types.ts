export type BookStatus = 'reading' | 'completed' | 'want_to_read' | 'paused' | 'dropped';

export type DropReason = 'too_many_books' | 'overwhelmed' | 'lost_interest' | 'other';

/**
 * Maps to PostgreSQL `book` + `user_book` + `publisher` + `author` + `genre` tables.
 */
export interface Book {
	id: string; // bookID (e.g. BK00000001 or book-1)
	userBookId?: string; // userBookID (e.g. UB00000001)
	title: string;
	author: string;
	publisher?: string;
	isbn13?: string;
	totalPages: number;
	currentPage: number;
	status: BookStatus;
	dropReason?: DropReason | null;
	coverColor?: string; // Hex tint fallback
	genre?: string;
	createdAt: string; // ISO 8601
	updatedAt: string; // ISO 8601
}

/**
 * Payload to add a new book to the user's shelf (`book` + `user_book`).
 */
export interface AddBookInput {
	title: string;
	author: string;
	publisher?: string;
	isbn13?: string;
	genre?: string;
	totalPages: number;
	status: 'reading' | 'want_to_read';
}

/**
 * Payload to change book shelf status (`user_book.status` & `user_book.dropReason`).
 */
export interface UpdateBookStatusInput {
	bookId: string;
	status: BookStatus;
	dropReason?: DropReason | null;
}

/**
 * Payload to generate or update a reading schedule (`reading_schedule` + `schedule_day`).
 */
export interface GenerateScheduleInput {
	bookId: string;
	targetPagesPerDay: number;
	activeDaysOfWeek?: number[]; // 1..7
	rationale?: string;
}

/**
 * Maps to PostgreSQL `progress_log` table (currentPage = startPage + pagesRead).
 */
export interface ReadingSession {
	id: string; // progressLogID (e.g. PL00000001)
	bookId: string; // foreign key -> book / user_book
	startPage?: number;
	pagesRead: number;
	currentPage?: number;
	minutesRead?: number | null;
	notes?: string | null;
	xpEarned: number;
	loggedAt: string; // YYYY-MM-DD
	createdAt: string; // ISO 8601
}

/**
 * Maps to daily target from `reading_schedule.pagesPerDayTarget`.
 */
export interface DailyGoal {
	id: string;
	targetPages: number;
	targetMinutes?: number | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * Maps to PostgreSQL `app_user` streak & concurrency columns + UI XP level state.
 */
export interface UserStats {
	id: string; // userID (e.g. US00000001)
	userName?: string;
	streakDays: number;
	longestStreak?: number;
	maxConcurrentBooks?: number;
	lastReadDate: string | null; // YYYY-MM-DD
	totalXp: number;
	currentLevel: number;
	xpToNextLevel: number;
	todayPagesRead: number;
	createdAt: string;
	updatedAt: string;
}

/**
 * Maps to PostgreSQL `reading_challenge` table (RC\d{8}).
 */
export interface ReadingChallenge {
	challengeId: string; // e.g. RC00000001
	userId: string;
	challengeYear: number;
	targetBooks: number;
	targetPages: number;
	completedBooks: number;
	completedPages: number;
}

/**
 * Maps to PostgreSQL `schedule_day` table (SD\d{8}).
 */
export interface ScheduleDayItem {
	scheduleDayId: string; // e.g. SD00000001
	scheduleId: string; // e.g. RS00000001
	scheduledDate: string; // YYYY-MM-DD
	dayName: string;
	bookTitle: string;
	targetPages: number;
	status: 'pending' | 'completed' | 'missed';
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
 * Maps to PostgreSQL `badge` + `user_badge` tables (BD\d{8}).
 */
export interface Badge {
	id: string;
	title: string;
	description: string;
	icon: 'flame' | 'book' | 'pages' | 'target' | 'star';
	criteriaType?: 'streak_days' | 'books_finished' | 'pages_read';
	criteriaValue?: number;
	isUnlocked: boolean;
	unlockedAt?: string;
}

/**
 * Maps to PostgreSQL `reading_schedule` table (RS\d{8}).
 */
export interface WeeklyPlanPreview {
	scheduleId?: string;
	targetPagesPerDay: number;
	estimatedPagesPerDay?: number;
	targetFinishDate?: string;
	predictedFinishDate?: string;
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

/**
 * Friend update item in the /bros social feed.
 */
export interface BroUpdate {
	id: string;
	userName: string;
	avatarInitials: string;
	avatarBg: string;
	timeAgo: string;
	message: string;
	badgeEmoji: string;
	celebrations: number;
	hasCelebrated: boolean;
}
