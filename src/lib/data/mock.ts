import type {
	AddBookInput,
	Badge,
	Book,
	BroUpdate,
	DailyGoal,
	GenerateScheduleInput,
	LogSessionInput,
	LogSessionResult,
	ReadingChallenge,
	ReadingSession,
	ScheduleDayItem,
	UpdateBookStatusInput,
	UserStats,
	WeekDayLog,
	WeeklyPlanPreview
} from '$lib/types';

// In-memory data store aligned with the 15-table PostgreSQL schema (db/schema.sql)
let books: Book[] = [
	{
		id: 'book-1',
		userBookId: 'UB00000001',
		title: 'Atomic Habits',
		author: 'James Clear',
		publisher: 'Penguin Random House',
		isbn13: '9780735211292',
		totalPages: 320,
		currentPage: 164,
		status: 'reading',
		dropReason: null,
		coverColor: '#0f766e',
		genre: 'Self-Improvement',
		createdAt: '2026-10-01T08:00:00Z',
		updatedAt: '2026-10-26T07:15:00Z'
	},
	{
		id: 'book-2',
		userBookId: 'UB00000002',
		title: 'Deep Work',
		author: 'Cal Newport',
		publisher: 'Grand Central Publishing',
		isbn13: '9781455586691',
		totalPages: 296,
		currentPage: 296,
		status: 'completed',
		dropReason: null,
		coverColor: '#1e293b',
		genre: 'Productivity',
		createdAt: '2026-09-15T10:00:00Z',
		updatedAt: '2026-10-20T14:30:00Z'
	},
	{
		id: 'book-3',
		userBookId: 'UB00000003',
		title: 'Klara and the Sun',
		author: 'Kazuo Ishiguro',
		publisher: 'Faber & Faber',
		isbn13: '9780593318171',
		totalPages: 303,
		currentPage: 0,
		status: 'want_to_read',
		dropReason: null,
		coverColor: '#6b21a8',
		genre: 'Fiction',
		createdAt: '2026-10-18T19:00:00Z',
		updatedAt: '2026-10-18T19:00:00Z'
	},
	{
		id: 'book-4',
		userBookId: 'UB00000004',
		title: 'Thinking, Fast and Slow',
		author: 'Daniel Kahneman',
		publisher: 'Farrar, Straus and Giroux',
		isbn13: '9780374533557',
		totalPages: 499,
		currentPage: 62,
		status: 'dropped',
		dropReason: 'too_many_books',
		coverColor: '#991b1b',
		genre: 'Psychology',
		createdAt: '2026-09-02T12:00:00Z',
		updatedAt: '2026-09-19T18:00:00Z'
	}
];

let dailyGoal: DailyGoal = {
	id: 'RS00000001',
	targetPages: 30,
	targetMinutes: 25,
	createdAt: '2026-10-01T00:00:00Z',
	updatedAt: '2026-10-26T00:00:00Z'
};

let userStats: UserStats = {
	id: 'US00000001',
	userName: 'Putra Abyasa',
	streakDays: 5,
	longestStreak: 12,
	maxConcurrentBooks: 3,
	lastReadDate: '2026-10-26',
	totalXp: 420,
	currentLevel: 3,
	xpToNextLevel: 500, // needs 80 more XP to reach level 4
	todayPagesRead: 18,
	createdAt: '2026-09-01T00:00:00Z',
	updatedAt: '2026-10-26T07:15:00Z'
};

let readingChallenge: ReadingChallenge = {
	challengeId: 'RC00000001',
	userId: 'US00000001',
	challengeYear: 2026,
	targetBooks: 12,
	targetPages: 3600,
	completedBooks: 1,
	completedPages: 522
};

let sessions: ReadingSession[] = [
	{
		id: 'PL00000005',
		bookId: 'book-1',
		startPage: 146,
		pagesRead: 18,
		currentPage: 164,
		minutesRead: 22,
		notes: 'Great insight on habit stacking and environmental cues.',
		xpEarned: 28,
		loggedAt: '2026-10-26',
		createdAt: '2026-10-26T07:15:00Z'
	},
	{
		id: 'PL00000004',
		bookId: 'book-1',
		startPage: 122,
		pagesRead: 24,
		currentPage: 146,
		minutesRead: 30,
		notes: 'Finished Chapter 5 on the 2-minute rule.',
		xpEarned: 34,
		loggedAt: '2026-10-25',
		createdAt: '2026-10-25T20:45:00Z'
	},
	{
		id: 'PL00000003',
		bookId: 'book-1',
		startPage: 90,
		pagesRead: 32,
		currentPage: 122,
		minutesRead: 40,
		notes: 'Identity-based habits resonate strongly.',
		xpEarned: 52,
		loggedAt: '2026-10-24',
		createdAt: '2026-10-24T18:30:00Z'
	},
	{
		id: 'PL00000002',
		bookId: 'book-1',
		startPage: 70,
		pagesRead: 20,
		currentPage: 90,
		minutesRead: 25,
		notes: 'Fundamentals of compounding small improvements.',
		xpEarned: 30,
		loggedAt: '2026-10-23',
		createdAt: '2026-10-23T21:10:00Z'
	},
	{
		id: 'PL00000001',
		bookId: 'book-1',
		startPage: 55,
		pagesRead: 15,
		currentPage: 70,
		minutesRead: 20,
		notes: 'Started reading the introduction.',
		xpEarned: 25,
		loggedAt: '2026-10-22',
		createdAt: '2026-10-22T08:00:00Z'
	}
];

let weekLogs: WeekDayLog[] = [
	{ date: '2026-10-20', dayLabel: 'M', dayName: 'Mon', pagesRead: 22, hasLogged: true, isToday: false },
	{ date: '2026-10-21', dayLabel: 'T', dayName: 'Tue', pagesRead: 0, hasLogged: false, isToday: false },
	{ date: '2026-10-22', dayLabel: 'W', dayName: 'Wed', pagesRead: 15, hasLogged: true, isToday: false },
	{ date: '2026-10-23', dayLabel: 'T', dayName: 'Thu', pagesRead: 20, hasLogged: true, isToday: false },
	{ date: '2026-10-24', dayLabel: 'F', dayName: 'Fri', pagesRead: 32, hasLogged: true, isToday: false },
	{ date: '2026-10-25', dayLabel: 'S', dayName: 'Sat', pagesRead: 24, hasLogged: true, isToday: false },
	{ date: '2026-10-26', dayLabel: 'S', dayName: 'Sun', pagesRead: 18, hasLogged: true, isToday: true }
];

let scheduleDays: ScheduleDayItem[] = [
	{
		scheduleDayId: 'SD00000001',
		scheduleId: 'RS00000001',
		scheduledDate: '2026-10-24',
		dayName: 'Fri',
		bookTitle: 'Atomic Habits',
		targetPages: 28,
		status: 'completed'
	},
	{
		scheduleDayId: 'SD00000002',
		scheduleId: 'RS00000001',
		scheduledDate: '2026-10-25',
		dayName: 'Sat',
		bookTitle: 'Atomic Habits',
		targetPages: 28,
		status: 'completed'
	},
	{
		scheduleDayId: 'SD00000003',
		scheduleId: 'RS00000001',
		scheduledDate: '2026-10-26',
		dayName: 'Sun (Today)',
		bookTitle: 'Atomic Habits',
		targetPages: 28,
		status: 'pending'
	},
	{
		scheduleDayId: 'SD00000004',
		scheduleId: 'RS00000001',
		scheduledDate: '2026-10-27',
		dayName: 'Mon',
		bookTitle: 'Atomic Habits',
		targetPages: 28,
		status: 'pending'
	}
];

let badges: Badge[] = [
	{
		id: 'BD00000001',
		title: '3-Day Streak',
		description: 'Maintained 3 consecutive days of reading',
		icon: 'flame',
		criteriaType: 'streak_days',
		criteriaValue: 3,
		isUnlocked: true,
		unlockedAt: '2026-10-24'
	},
	{
		id: 'BD00000002',
		title: '100 Pages Read',
		description: 'Crossed your first century of pages read',
		icon: 'pages',
		criteriaType: 'pages_read',
		criteriaValue: 100,
		isUnlocked: true,
		unlockedAt: '2026-10-25'
	},
	{
		id: 'BD00000003',
		title: 'First Book Finished',
		description: 'Completed your first book cover to cover',
		icon: 'book',
		criteriaType: 'books_finished',
		criteriaValue: 1,
		isUnlocked: true,
		unlockedAt: '2026-10-20'
	},
	{
		id: 'BD00000004',
		title: '7-Day Master',
		description: 'Complete a full 7-day uninterrupted streak',
		icon: 'target',
		criteriaType: 'streak_days',
		criteriaValue: 7,
		isUnlocked: false
	},
	{
		id: 'BD00000005',
		title: '500 Pages Club',
		description: 'Read 500 cumulative pages across your shelf',
		icon: 'star',
		criteriaType: 'pages_read',
		criteriaValue: 500,
		isUnlocked: false
	}
];

let weeklyPlan: WeeklyPlanPreview = {
	scheduleId: 'RS00000001',
	targetPagesPerDay: 28,
	estimatedPagesPerDay: 26.5,
	targetFinishDate: '2026-10-31',
	predictedFinishDate: '2026-11-01',
	recommendedBookTitle: 'Atomic Habits',
	rationale: 'Based on your 22-min average sessions last week, pacing 28 pages/day finishes Atomic Habits by Halloween.',
	projectedWeeklyPages: 196
};

let broUpdates: BroUpdate[] = [
	{
		id: 'bro-1',
		userName: 'Stella Olivia',
		avatarInitials: 'SO',
		avatarBg: '#0f766e',
		timeAgo: '2h ago',
		message: 'Reached a 7-day reading streak and finished 30 pages of Atomic Habits!',
		badgeEmoji: '🔥',
		celebrations: 4,
		hasCelebrated: true
	},
	{
		id: 'bro-2',
		userName: 'Ricky Satria',
		avatarInitials: 'RS',
		avatarBg: '#b45309',
		timeAgo: '5h ago',
		message: 'Completed Deep Work cover to cover (+100 XP bonus)!',
		badgeEmoji: '📚',
		celebrations: 2,
		hasCelebrated: false
	}
];

// --- Query functions ---

export function getBooks(): Book[] {
	return [...books];
}

export function getBookById(id: string): Book | undefined {
	return books.find((b) => b.id === id || b.userBookId === id);
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

export function getReadingChallenge(): ReadingChallenge {
	const completedBooks = books.filter((b) => b.status === 'completed').length;
	const completedPages = books.reduce((sum, b) => sum + b.currentPage, 0);
	return {
		...readingChallenge,
		completedBooks,
		completedPages
	};
}

export function getScheduleDays(): ScheduleDayItem[] {
	return [...scheduleDays];
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

export function getBadges(): Badge[] {
	return [...badges];
}

export function getWeeklyPlan(): WeeklyPlanPreview {
	return { ...weeklyPlan };
}

export function getBroUpdates(): BroUpdate[] {
	return broUpdates.map((u) => ({ ...u }));
}

export function toggleCelebrateBro(id: string): void {
	const item = broUpdates.find((u) => u.id === id);
	if (item) {
		item.hasCelebrated = !item.hasCelebrated;
		item.celebrations += item.hasCelebrated ? 1 : -1;
	}
}

// --- Mutation functions ---

export function addBookToShelf(input: AddBookInput): Book {
	const activeCount = books.filter((b) => b.status === 'reading').length;
	const maxConcurrent = userStats.maxConcurrentBooks ?? 3;
	const effectiveStatus =
		input.status === 'reading' && activeCount >= maxConcurrent ? 'want_to_read' : input.status;

	const nextIndex = books.length + 1;
	const newBook: Book = {
		id: `book-${nextIndex}`,
		userBookId: `UB${String(nextIndex).padStart(8, '0')}`,
		title: input.title.trim(),
		author: input.author.trim(),
		publisher: input.publisher?.trim() || 'Independent Press',
		isbn13: input.isbn13?.trim() || undefined,
		genre: input.genre?.trim() || 'General',
		totalPages: Math.max(1, Math.round(input.totalPages)),
		currentPage: 0,
		status: effectiveStatus,
		dropReason: null,
		coverColor: '#0f766e',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	books = [newBook, ...books];
	return newBook;
}

export function updateBookStatus(input: UpdateBookStatusInput): Book {
	const book = books.find((b) => b.id === input.bookId || b.userBookId === input.bookId);
	if (!book) {
		throw new Error(`Book "${input.bookId}" not found`);
	}

	if (input.status === 'reading' && book.status !== 'reading') {
		const activeCount = books.filter((b) => b.status === 'reading').length;
		const maxConcurrent = userStats.maxConcurrentBooks ?? 3;
		if (activeCount >= maxConcurrent) {
			throw new Error(`Max concurrent reading limit (${maxConcurrent} books) reached! Finish, pause, or drop an active book first.`);
		}
	}

	book.status = input.status;
	book.dropReason = input.status === 'dropped' ? (input.dropReason ?? 'other') : null;
	if (input.status === 'completed') {
		book.currentPage = book.totalPages;
	}
	book.updatedAt = new Date().toISOString();
	return { ...book };
}

export function generateReadingSchedule(input: GenerateScheduleInput): {
	plan: WeeklyPlanPreview;
	days: ScheduleDayItem[];
} {
	const book = books.find((b) => b.id === input.bookId || b.userBookId === input.bookId) ?? books[0];
	const safeTarget = Math.max(5, Math.round(input.targetPagesPerDay));
	const remainingPages = Math.max(safeTarget, book.totalPages - book.currentPage);
	const daysNeeded = Math.max(1, Math.ceil(remainingPages / safeTarget));

	const finishDate = new Date();
	finishDate.setDate(finishDate.getDate() + daysNeeded);
	const finishDateIso = finishDate.toISOString().split('T')[0];

	dailyGoal.targetPages = safeTarget;

	weeklyPlan = {
		scheduleId: 'RS00000001',
		targetPagesPerDay: safeTarget,
		estimatedPagesPerDay: safeTarget,
		targetFinishDate: finishDateIso,
		predictedFinishDate: finishDateIso,
		recommendedBookTitle: book.title,
		rationale:
			input.rationale?.trim() ||
			`Pacing ${safeTarget} pages/day finishes the remaining ${remainingPages} pages of ${book.title} in ${daysNeeded} days (${finishDateIso}).`,
		projectedWeeklyPages: safeTarget * 7
	};

	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const generatedDays: ScheduleDayItem[] = [];
	for (let i = 0; i < 4; i++) {
		const d = new Date();
		d.setDate(d.getDate() + i);
		const iso = d.toISOString().split('T')[0];
		const label = i === 0 ? `${dayNames[d.getDay()]} (Today)` : dayNames[d.getDay()];
		generatedDays.push({
			scheduleDayId: `SD${String(i + 1).padStart(8, '0')}`,
			scheduleId: 'RS00000001',
			scheduledDate: iso,
			dayName: label,
			bookTitle: book.title,
			targetPages: safeTarget,
			status: i === 0 && userStats.todayPagesRead >= safeTarget ? 'completed' : 'pending'
		});
	}

	scheduleDays = generatedDays;
	return { plan: { ...weeklyPlan }, days: [...scheduleDays] };
}

export function logReadingSession(input: LogSessionInput): LogSessionResult {
	const book = books.find((b) => b.id === input.bookId || b.userBookId === input.bookId);
	if (!book) {
		throw new Error(`Book with id "${input.bookId}" not found`);
	}

	const safePages = Math.max(1, Math.round(input.pagesRead));
	const safeMinutes = input.minutesRead ? Math.max(1, Math.round(input.minutesRead)) : null;

	const wasGoalMet = userStats.todayPagesRead >= dailyGoal.targetPages;
	const isGoalMetNow = userStats.todayPagesRead + safePages >= dailyGoal.targetPages;
	const isGoalNewlyMet = !wasGoalMet && isGoalMetNow;
	const goalBonus = isGoalNewlyMet ? 20 : 0;
	const xpEarned = 10 + safePages + goalBonus;

	const startPage = book.currentPage;
	// Update Book (progress_log constraint: currentPage = startPage + pagesRead)
	book.currentPage = Math.min(book.totalPages, book.currentPage + safePages);
	if (book.currentPage >= book.totalPages) {
		book.status = 'completed';
	}
	book.updatedAt = new Date().toISOString();

	// Update User Stats
	userStats.todayPagesRead += safePages;
	userStats.totalXp += xpEarned;
	const newLevel = Math.floor(userStats.totalXp / 200) + 1;
	userStats.currentLevel = newLevel;
	userStats.xpToNextLevel = newLevel * 200;
	userStats.updatedAt = new Date().toISOString();

	// Check if 500 Pages badge unlocked
	const totalPagesAcrossShelf = books.reduce((sum, b) => sum + b.currentPage, 0);
	if (totalPagesAcrossShelf >= 500) {
		const badge500 = badges.find((b) => b.id === 'BD00000005');
		if (badge500) {
			badge500.isUnlocked = true;
			badge500.unlockedAt = new Date().toISOString().split('T')[0];
		}
	}

	// Update week logs
	const todayEntry = weekLogs.find((w) => w.isToday);
	if (todayEntry) {
		todayEntry.pagesRead += safePages;
		todayEntry.hasLogged = true;
	}

	// Mark today's schedule_day as completed if target met
	const todaySchedule = scheduleDays.find((s) => s.scheduleDayId === 'SD00000003' || s.dayName.includes('Today'));
	if (todaySchedule && userStats.todayPagesRead >= todaySchedule.targetPages) {
		todaySchedule.status = 'completed';
	}

	// Create and prepend session (PL\d{8} style ID)
	const nextLogNum = String(sessions.length + 1).padStart(8, '0');
	const newSession: ReadingSession = {
		id: `PL${nextLogNum}`,
		bookId: book.id,
		startPage,
		pagesRead: safePages,
		currentPage: startPage + safePages,
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
		bookUpdated: { ...book },
		isGoalNewlyMet
	};
}
