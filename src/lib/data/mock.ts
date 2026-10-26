import type {
	Book,
	DailyGoal,
	LogSessionInput,
	LogSessionResult,
	ReadingSession,
	UserStats,
	WeekDayLog
} from '$lib/types';

// In-memory data store (resets on server restart / page hard refresh; no localStorage)
let books: Book[] = [
	{
		id: 'book-1',
		title: 'Atomic Habits',
		author: 'James Clear',
		totalPages: 320,
		currentPage: 164,
		status: 'reading',
		coverColor: '#0f766e',
		genre: 'Self-Improvement',
		createdAt: '2026-10-01T08:00:00Z',
		updatedAt: '2026-10-26T07:15:00Z'
	},
	{
		id: 'book-2',
		title: 'Deep Work',
		author: 'Cal Newport',
		totalPages: 296,
		currentPage: 296,
		status: 'completed',
		coverColor: '#334155',
		genre: 'Productivity',
		createdAt: '2026-09-15T10:00:00Z',
		updatedAt: '2026-10-20T14:30:00Z'
	},
	{
		id: 'book-3',
		title: 'Klara and the Sun',
		author: 'Kazuo Ishiguro',
		totalPages: 303,
		currentPage: 0,
		status: 'want_to_read',
		coverColor: '#7c3aed',
		genre: 'Fiction',
		createdAt: '2026-10-18T19:00:00Z',
		updatedAt: '2026-10-18T19:00:00Z'
	}
];

let dailyGoal: DailyGoal = {
	id: 'goal-1',
	targetPages: 30,
	targetMinutes: 25,
	createdAt: '2026-10-01T00:00:00Z',
	updatedAt: '2026-10-26T00:00:00Z'
};

let userStats: UserStats = {
	id: 'user-1',
	streakDays: 5,
	lastReadDate: '2026-10-26',
	totalXp: 420,
	currentLevel: 3,
	xpToNextLevel: 500, // needs 80 more XP to reach level 4
	todayPagesRead: 18,
	createdAt: '2026-09-01T00:00:00Z',
	updatedAt: '2026-10-26T07:15:00Z'
};

let sessions: ReadingSession[] = [
	{
		id: 'session-1',
		bookId: 'book-1',
		pagesRead: 18,
		minutesRead: 22,
		notes: 'Great insight on habit stacking and environmental cues.',
		xpEarned: 28,
		loggedAt: '2026-10-26',
		createdAt: '2026-10-26T07:15:00Z'
	},
	{
		id: 'session-2',
		bookId: 'book-1',
		pagesRead: 24,
		minutesRead: 30,
		notes: 'Finished Chapter 5 on the 2-minute rule.',
		xpEarned: 34,
		loggedAt: '2026-10-25',
		createdAt: '2026-10-25T20:45:00Z'
	},
	{
		id: 'session-3',
		bookId: 'book-1',
		pagesRead: 32,
		minutesRead: 40,
		notes: 'Identity-based habits resonate strongly.',
		xpEarned: 52,
		loggedAt: '2026-10-24',
		createdAt: '2026-10-24T18:30:00Z'
	},
	{
		id: 'session-4',
		bookId: 'book-1',
		pagesRead: 20,
		minutesRead: 25,
		notes: 'Fundamentals of compounding small improvements.',
		xpEarned: 30,
		loggedAt: '2026-10-23',
		createdAt: '2026-10-23T21:10:00Z'
	},
	{
		id: 'session-5',
		bookId: 'book-1',
		pagesRead: 15,
		minutesRead: 20,
		notes: 'Started reading the introduction.',
		xpEarned: 25,
		loggedAt: '2026-10-22',
		createdAt: '2026-10-22T08:00:00Z'
	}
];

// 7-day strip (Mon - Sun)
let weekLogs: WeekDayLog[] = [
	{ date: '2026-10-20', dayLabel: 'M', dayName: 'Mon', pagesRead: 22, hasLogged: true, isToday: false },
	{ date: '2026-10-21', dayLabel: 'T', dayName: 'Tue', pagesRead: 0, hasLogged: false, isToday: false },
	{ date: '2026-10-22', dayLabel: 'W', dayName: 'Wed', pagesRead: 15, hasLogged: true, isToday: false },
	{ date: '2026-10-23', dayLabel: 'T', dayName: 'Thu', pagesRead: 20, hasLogged: true, isToday: false },
	{ date: '2026-10-24', dayLabel: 'F', dayName: 'Fri', pagesRead: 32, hasLogged: true, isToday: false },
	{ date: '2026-10-25', dayLabel: 'S', dayName: 'Sat', pagesRead: 24, hasLogged: true, isToday: false },
	{ date: '2026-10-26', dayLabel: 'S', dayName: 'Sun', pagesRead: 18, hasLogged: true, isToday: true }
];

// --- Query Functions (matching what future PostgreSQL API or load functions will call) ---

export function getBooks(): Book[] {
	return [...books];
}

export function getBookById(id: string): Book | undefined {
	return books.find((b) => b.id === id);
}

export function getCurrentlyReading(): Book | undefined {
	return books.find((b) => b.status === 'reading');
}

export function getDailyGoal(): DailyGoal {
	return { ...dailyGoal };
}

export function getUserStats(): UserStats {
	return { ...userStats };
}

export function getSessionsForBook(bookId: string): ReadingSession[] {
	return sessions.filter((s) => s.bookId === bookId);
}

export function getRecentSessions(limit = 10): ReadingSession[] {
	return sessions.slice(0, limit);
}

export function getWeekDays(): WeekDayLog[] {
	return [...weekLogs];
}

// --- Mutation Functions (in-memory state updates) ---

export function logReadingSession(input: LogSessionInput): LogSessionResult {
	const book = books.find((b) => b.id === input.bookId);
	if (!book) {
		throw new Error(`Book with id "${input.bookId}" not found`);
	}

	const safePages = Math.max(1, Math.round(input.pagesRead));
	const safeMinutes = input.minutesRead ? Math.max(1, Math.round(input.minutesRead)) : null;

	// Calculate XP: 10 base XP + 1 XP per page + 20 bonus if daily goal completed
	const wasGoalMet = userStats.todayPagesRead >= dailyGoal.targetPages;
	const isGoalMetNow = userStats.todayPagesRead + safePages >= dailyGoal.targetPages;
	const goalBonus = !wasGoalMet && isGoalMetNow ? 20 : 0;
	const xpEarned = 10 + safePages + goalBonus;

	// Update Book progress
	book.currentPage = Math.min(book.totalPages, book.currentPage + safePages);
	if (book.currentPage >= book.totalPages) {
		book.status = 'completed';
	}
	book.updatedAt = new Date().toISOString();

	// Update User Stats
	userStats.todayPagesRead += safePages;
	userStats.totalXp += xpEarned;

	// Level up threshold: every 200 XP = 1 level
	const newLevel = Math.floor(userStats.totalXp / 200) + 1;
	userStats.currentLevel = newLevel;
	userStats.xpToNextLevel = newLevel * 200;
	userStats.updatedAt = new Date().toISOString();

	// Update today's entry in weekly habits
	const todayEntry = weekLogs.find((w) => w.isToday);
	if (todayEntry) {
		todayEntry.pagesRead += safePages;
		todayEntry.hasLogged = true;
	}

	// Create and prepend session
	const newSession: ReadingSession = {
		id: `session-${Date.now()}`,
		bookId: input.bookId,
		pagesRead: safePages,
		minutesRead: safeMinutes,
		notes: input.notes?.trim() || null,
		xpEarned,
		loggedAt: new Date().toISOString().split('T')[0],
		createdAt: new Date().toISOString()
	};

	sessions = [newSession, ...sessions];

	return {
		session: newSession,
		xpEarned,
		newStreak: userStats.streakDays,
		totalXp: userStats.totalXp,
		currentLevel: userStats.currentLevel,
		bookUpdated: { ...book }
	};
}
