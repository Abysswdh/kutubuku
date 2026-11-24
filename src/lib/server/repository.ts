import { getDb } from '$lib/server/db';
import {
	addBookToShelf as mockAddBook,
	generateReadingSchedule as mockGenerateSchedule,
	getBadges as mockGetBadges,
	getBookById as mockGetBookById,
	getBooks as mockGetBooks,
	getBroUpdates as mockGetBroUpdates,
	getCurrentlyReading as mockGetCurrentlyReading,
	getDailyGoal as mockGetDailyGoal,
	getReadingChallenge as mockGetReadingChallenge,
	getRecentSessions as mockGetRecentSessions,
	getScheduleDays as mockGetScheduleDays,
	getSessionsForBook as mockGetSessionsForBook,
	getUserStats as mockGetUserStats,
	getWeekDays as mockGetWeekDays,
	getWeeklyPlan as mockGetWeeklyPlan,
	logReadingSession as mockLogSession,
	updateBookStatus as mockUpdateBookStatus
} from '$lib/data/mock';
import type {
	AddBookInput,
	Badge,
	Book,
	BookStatus,
	BroUpdate,
	DailyGoal,
	DropReason,
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

const DEFAULT_USER_ID = 'US00000001';

function mapDbStatusToUi(status: string): BookStatus {
	if (status === 'finished') return 'completed';
	if (status === 'planned') return 'want_to_read';
	if (status === 'paused' || status === 'dropped' || status === 'reading') return status;
	return 'want_to_read';
}

function mapUiStatusToDb(status: BookStatus): string {
	if (status === 'completed') return 'finished';
	if (status === 'want_to_read') return 'planned';
	return status;
}

/**
 * Fetches all books on the user's shelf by joining `user_book`, `book`, `publisher`, `book_author`, `author`, `book_genre`, `genre`.
 * Falls back to `mock.ts` if `DATABASE_URL` is not configured.
 */
export async function fetchBooks(userId = DEFAULT_USER_ID): Promise<Book[]> {
	const sql = getDb();
	if (!sql) return mockGetBooks();

	try {
		const rows = await sql`
			SELECT
				b.bookid AS "bookId",
				ub.userbookid AS "userBookId",
				b.title,
				p.publishername AS "publisher",
				b.isbn13,
				b.pagecount AS "totalPages",
				ub.currentpage AS "currentPage",
				ub.status,
				ub.dropreason AS "dropReason",
				ub.addedat AS "addedAt",
				COALESCE(
					(SELECT string_agg(a.authorname, ', ')
					 FROM book_author ba
					 JOIN author a ON a.authorid = ba.authorid
					 WHERE ba.bookid = b.bookid),
					'Unknown Author'
				) AS "author",
				COALESCE(
					(SELECT g.genrename
					 FROM book_genre bg
					 JOIN genre g ON g.genreid = bg.genreid
					 WHERE bg.bookid = b.bookid
					 LIMIT 1),
					'General'
				) AS "genre"
			FROM user_book ub
			JOIN book b ON b.bookid = ub.bookid
			LEFT JOIN publisher p ON p.publisherid = b.publisherid
			WHERE ub.userid = ${userId}
			ORDER BY ub.addedat DESC
		`;

		return rows.map((r) => ({
			id: String(r.bookId).trim(),
			userBookId: String(r.userBookId).trim(),
			title: r.title,
			author: r.author,
			publisher: r.publisher ?? undefined,
			isbn13: r.isbn13 ? String(r.isbn13).trim() : undefined,
			totalPages: Number(r.totalPages),
			currentPage: Number(r.currentPage),
			status: mapDbStatusToUi(r.status),
			dropReason: (r.dropReason as DropReason) ?? null,
			genre: r.genre,
			coverColor: '#0f766e',
			createdAt: new Date(r.addedAt).toISOString(),
			updatedAt: new Date(r.addedAt).toISOString()
		}));
	} catch (err) {
		console.warn('[kutubuku/db] Falling back to mock books:', err);
		return mockGetBooks();
	}
}

export async function fetchBookById(bookId: string, userId = DEFAULT_USER_ID): Promise<Book | undefined> {
	const books = await fetchBooks(userId);
	return books.find((b) => b.id === bookId || b.userBookId === bookId) ?? mockGetBookById(bookId);
}

export async function fetchCurrentlyReading(userId = DEFAULT_USER_ID): Promise<Book | undefined> {
	const books = await fetchBooks(userId);
	return books.find((b) => b.status === 'reading');
}

export async function fetchUserStats(userId = DEFAULT_USER_ID): Promise<UserStats> {
	const sql = getDb();
	if (!sql) return mockGetUserStats();

	try {
		const [user] = await sql`
			SELECT
				u.userid AS "userId",
				u.username AS "userName",
				u.currentstreak AS "currentStreak",
				u.longeststreak AS "longestStreak",
				u.maxconcurrentbooks AS "maxConcurrentBooks",
				u.lastactivitydate AS "lastActivityDate",
				u.registerdate AS "registerDate",
				COALESCE((
					SELECT SUM(pl.pagesread)
					FROM progress_log pl
					JOIN user_book ub ON ub.userbookid = pl.userbookid
					WHERE ub.userid = u.userid AND pl.logdate = CURRENT_DATE
				), 0) AS "todayPagesRead",
				COALESCE((
					SELECT SUM(pl.pagesread * 1 + 10)
					FROM progress_log pl
					JOIN user_book ub ON ub.userbookid = pl.userbookid
					WHERE ub.userid = u.userid
				), 0) AS "totalXp"
			FROM app_user u
			WHERE u.userid = ${userId}
			LIMIT 1
		`;

		if (!user) return mockGetUserStats();

		const totalXp = Number(user.totalXp) || 0;
		const currentLevel = Math.floor(totalXp / 200) + 1;

		return {
			id: String(user.userId).trim(),
			userName: user.userName,
			streakDays: Number(user.currentStreak),
			longestStreak: Number(user.longestStreak),
			maxConcurrentBooks: Number(user.maxConcurrentBooks),
			lastReadDate: user.lastActivityDate
				? new Date(user.lastActivityDate).toISOString().split('T')[0]
				: null,
			totalXp,
			currentLevel,
			xpToNextLevel: currentLevel * 200,
			todayPagesRead: Number(user.todayPagesRead),
			createdAt: new Date(user.registerDate).toISOString(),
			updatedAt: new Date().toISOString()
		};
	} catch (err) {
		console.warn('[kutubuku/db] Falling back to mock userStats:', err);
		return mockGetUserStats();
	}
}

export async function fetchDailyGoal(userId = DEFAULT_USER_ID): Promise<DailyGoal> {
	const sql = getDb();
	if (!sql) return mockGetDailyGoal();

	try {
		const [sched] = await sql`
			SELECT rs.scheduleid AS "id", rs.pagesperdaytarget AS "targetPages", rs.createdat AS "createdAt"
			FROM reading_schedule rs
			JOIN user_book ub ON ub.userbookid = rs.userbookid
			WHERE ub.userid = ${userId} AND rs.status = 'active'
			ORDER BY rs.createdat DESC
			LIMIT 1
		`;
		if (!sched) return mockGetDailyGoal();
		return {
			id: String(sched.id).trim(),
			targetPages: Number(sched.targetPages),
			targetMinutes: 25,
			createdAt: new Date(sched.createdAt).toISOString(),
			updatedAt: new Date(sched.createdAt).toISOString()
		};
	} catch {
		return mockGetDailyGoal();
	}
}

export async function fetchReadingChallenge(userId = DEFAULT_USER_ID): Promise<ReadingChallenge> {
	const sql = getDb();
	if (!sql) return mockGetReadingChallenge();

	try {
		const [row] = await sql`
			SELECT
				rc.challengeid AS "challengeId",
				rc.userid AS "userId",
				rc.challengeyear AS "challengeYear",
				COALESCE(rc.targetbooks, 12) AS "targetBooks",
				COALESCE(rc.targetpages, 3600) AS "targetPages",
				(SELECT COUNT(*) FROM user_book ub WHERE ub.userid = rc.userid AND ub.status = 'finished') AS "completedBooks",
				COALESCE((SELECT SUM(ub.currentpage) FROM user_book ub WHERE ub.userid = rc.userid), 0) AS "completedPages"
			FROM reading_challenge rc
			WHERE rc.userid = ${userId}
			ORDER BY rc.challengeyear DESC
			LIMIT 1
		`;
		if (!row) return mockGetReadingChallenge();
		return {
			challengeId: String(row.challengeId).trim(),
			userId: String(row.userId).trim(),
			challengeYear: Number(row.challengeYear),
			targetBooks: Number(row.targetBooks),
			targetPages: Number(row.targetPages),
			completedBooks: Number(row.completedBooks),
			completedPages: Number(row.completedPages)
		};
	} catch {
		return mockGetReadingChallenge();
	}
}

export async function fetchBadges(userId = DEFAULT_USER_ID): Promise<Badge[]> {
	const sql = getDb();
	if (!sql) return mockGetBadges();

	try {
		const rows = await sql`
			SELECT
				b.badgeid AS "id",
				b.badgename AS "title",
				b.description,
				b.iconurl AS "icon",
				b.criteriatype AS "criteriaType",
				b.criteriavalue AS "criteriaValue",
				ub.awardedat AS "unlockedAt"
			FROM badge b
			LEFT JOIN user_badge ub ON ub.badgeid = b.badgeid AND ub.userid = ${userId}
			ORDER BY b.badgeid ASC
		`;
		if (rows.length === 0) return mockGetBadges();
		return rows.map((r) => ({
			id: String(r.id).trim(),
			title: r.title,
			description: r.description,
			icon: (['flame', 'book', 'pages', 'target', 'star'].includes(r.icon) ? r.icon : 'star') as Badge['icon'],
			criteriaType: r.criteriaType,
			criteriaValue: Number(r.criteriaValue),
			isUnlocked: Boolean(r.unlockedAt),
			unlockedAt: r.unlockedAt ? new Date(r.unlockedAt).toISOString().split('T')[0] : undefined
		}));
	} catch {
		return mockGetBadges();
	}
}

export async function fetchSessionsForBook(bookId: string, userId = DEFAULT_USER_ID): Promise<ReadingSession[]> {
	const sql = getDb();
	if (!sql) return mockGetSessionsForBook(bookId);

	try {
		const rows = await sql`
			SELECT
				pl.progresslogid AS "id",
				ub.bookid AS "bookId",
				pl.startpage AS "startPage",
				pl.pagesread AS "pagesRead",
				pl.currentpage AS "currentPage",
				pl.minutesread AS "minutesRead",
				pl.note AS "notes",
				pl.logdate AS "loggedAt",
				pl.createdat AS "createdAt"
			FROM progress_log pl
			JOIN user_book ub ON ub.userbookid = pl.userbookid
			WHERE ub.userid = ${userId} AND (TRIM(ub.bookid) = ${bookId} OR TRIM(ub.userbookid) = ${bookId})
			ORDER BY pl.logdate DESC, pl.createdat DESC
		`;
		if (rows.length === 0) return [];
		return rows.map((r) => ({
			id: String(r.id).trim(),
			bookId: String(r.bookId).trim(),
			startPage: Number(r.startPage),
			pagesRead: Number(r.pagesRead),
			currentPage: Number(r.currentPage),
			minutesRead: r.minutesRead ? Number(r.minutesRead) : null,
			notes: r.notes,
			xpEarned: 10 + Number(r.pagesRead),
			loggedAt: new Date(r.loggedAt).toISOString().split('T')[0],
			createdAt: new Date(r.createdAt).toISOString()
		}));
	} catch {
		return mockGetSessionsForBook(bookId);
	}
}

export async function fetchRecentSessions(limit = 5, userId = DEFAULT_USER_ID): Promise<ReadingSession[]> {
	const sql = getDb();
	if (!sql) return mockGetRecentSessions(limit);

	try {
		const rows = await sql`
			SELECT
				pl.progresslogid AS "id",
				ub.bookid AS "bookId",
				pl.startpage AS "startPage",
				pl.pagesread AS "pagesRead",
				pl.currentpage AS "currentPage",
				pl.minutesread AS "minutesRead",
				pl.note AS "notes",
				pl.logdate AS "loggedAt",
				pl.createdat AS "createdAt"
			FROM progress_log pl
			JOIN user_book ub ON ub.userbookid = pl.userbookid
			WHERE ub.userid = ${userId}
			ORDER BY pl.logdate DESC, pl.createdat DESC
			LIMIT ${limit}
		`;
		if (rows.length === 0) return [];
		return rows.map((r) => ({
			id: String(r.id).trim(),
			bookId: String(r.bookId).trim(),
			startPage: Number(r.startPage),
			pagesRead: Number(r.pagesRead),
			currentPage: Number(r.currentPage),
			minutesRead: r.minutesRead ? Number(r.minutesRead) : null,
			notes: r.notes,
			xpEarned: 10 + Number(r.pagesRead),
			loggedAt: new Date(r.loggedAt).toISOString().split('T')[0],
			createdAt: new Date(r.createdAt).toISOString()
		}));
	} catch {
		return mockGetRecentSessions(limit);
	}
}

export async function fetchWeeklyPlan(): Promise<WeeklyPlanPreview> {
	return mockGetWeeklyPlan();
}

export async function fetchScheduleDays(): Promise<ScheduleDayItem[]> {
	return mockGetScheduleDays();
}

export async function fetchWeekDays(): Promise<WeekDayLog[]> {
	return mockGetWeekDays();
}

export async function fetchBroUpdates(): Promise<BroUpdate[]> {
	return mockGetBroUpdates();
}

// --- Server Mutations (writes to both Mock and DB if connected) ---

export async function createBookOnShelf(
	input: AddBookInput,
	userId = DEFAULT_USER_ID
): Promise<Book> {
	const created = mockAddBook(input);
	const sql = getDb();
	if (!sql) return created;

	try {
		const [bookMax] = await sql`SELECT COALESCE(MAX(SUBSTRING(bookid FROM 3)::int), 0) AS max_num FROM book`;
		const bookId = `BK${String(Number(bookMax?.max_num ?? 0) + 1).padStart(8, '0')}`;
		const [ubMax] = await sql`SELECT COALESCE(MAX(SUBSTRING(userbookid FROM 3)::int), 0) AS max_num FROM user_book`;
		const userBookId = `UB${String(Number(ubMax?.max_num ?? 0) + 1).padStart(8, '0')}`;
		const dbStatus = mapUiStatusToDb(created.status);

		await sql`
			INSERT INTO book (bookid, publisherid, title, isbn13, pagecount, description)
			VALUES (${bookId}, 'PU00000001', ${created.title}, ${created.isbn13 ?? null}, ${created.totalPages}, ${created.genre ?? 'General'})
		`;

		if (created.author && created.author !== 'Unknown Author') {
			const [existingAuthor] = await sql`
				SELECT authorid FROM author WHERE LOWER(authorname) = ${created.author.toLowerCase()} LIMIT 1
			`;
			let authorId = existingAuthor?.authorid ? String(existingAuthor.authorid).trim() : null;
			if (!authorId) {
				const [auMax] = await sql`SELECT COALESCE(MAX(SUBSTRING(authorid FROM 3)::int), 0) AS max_num FROM author`;
				authorId = `AU${String(Number(auMax?.max_num ?? 0) + 1).padStart(8, '0')}`;
				await sql`INSERT INTO author (authorid, authorname) VALUES (${authorId}, ${created.author})`;
			}
			await sql`INSERT INTO book_author (bookid, authorid) VALUES (${bookId}, ${authorId}) ON CONFLICT DO NOTHING`;
		}

		await sql`
			INSERT INTO user_book (userbookid, userid, bookid, status, currentpage, startdate)
			VALUES (${userBookId}, ${userId}, ${bookId}, ${dbStatus}, 0, ${dbStatus === 'reading' ? new Date().toISOString().split('T')[0] : null})
		`;
		return { ...created, id: bookId, userBookId };
	} catch (err) {
		console.warn('[kutubuku/db] Add book fallback to mock:', err);
		return created;
	}
}

export async function changeBookShelfStatus(
	input: UpdateBookStatusInput,
	userId = DEFAULT_USER_ID
): Promise<Book> {
	const updated = mockUpdateBookStatus(input);
	const sql = getDb();
	if (!sql) return updated;

	try {
		const dbStatus = mapUiStatusToDb(input.status);
		const dropReason = input.status === 'dropped' ? (input.dropReason ?? 'other') : null;
		await sql`
			UPDATE user_book
			SET status = ${dbStatus}, dropreason = ${dropReason}
			WHERE userid = ${userId} AND (TRIM(bookid) = ${input.bookId} OR TRIM(userbookid) = ${input.bookId})
		`;
	} catch (err) {
		console.warn('[kutubuku/db] Update status fallback to mock:', err);
	}
	return updated;
}

export async function updateBookDetails(
	input: {
		bookId: string;
		title: string;
		author?: string;
		totalPages: number;
		currentPage?: number;
		genre?: string;
	},
	userId = DEFAULT_USER_ID
): Promise<void> {
	const title = input.title.trim();
	const author = input.author?.trim() || '';
	const totalPages = Math.max(1, Math.round(input.totalPages));
	const currentPage =
		input.currentPage !== undefined
			? Math.max(0, Math.min(totalPages, Math.round(input.currentPage)))
			: undefined;
	const genre = input.genre?.trim() || 'General';

	if (!title) throw new Error('Book title is required.');

	const sql = getDb();
	if (!sql) return;

	const [ub] = await sql`
		SELECT ub.userbookid AS "userBookId", ub.bookid AS "bookId"
		FROM user_book ub
		WHERE ub.userid = ${userId} AND (TRIM(ub.bookid) = ${input.bookId} OR TRIM(ub.userbookid) = ${input.bookId})
		LIMIT 1
	`;
	if (!ub) throw new Error('Book not found on your shelf.');

	const bookId = String(ub.bookId).trim();

	await sql`
		UPDATE book
		SET title = ${title}, pagecount = ${totalPages}, description = ${genre}
		WHERE bookid = ${bookId}
	`;

	if (currentPage !== undefined) {
		await sql`
			UPDATE user_book
			SET currentpage = ${currentPage}
			WHERE userbookid = ${ub.userBookId}
		`;
	}

	if (author) {
		const [existingAuthor] = await sql`
			SELECT authorid FROM author WHERE LOWER(authorname) = ${author.toLowerCase()} LIMIT 1
		`;
		let authorId = existingAuthor?.authorid ? String(existingAuthor.authorid).trim() : null;
		if (!authorId) {
			const [auMax] = await sql`SELECT COALESCE(MAX(SUBSTRING(authorid FROM 3)::int), 0) AS max_num FROM author`;
			authorId = `AU${String(Number(auMax?.max_num ?? 0) + 1).padStart(8, '0')}`;
			await sql`INSERT INTO author (authorid, authorname) VALUES (${authorId}, ${author})`;
		}
		await sql`DELETE FROM book_author WHERE bookid = ${bookId}`;
		await sql`INSERT INTO book_author (bookid, authorid) VALUES (${bookId}, ${authorId}) ON CONFLICT DO NOTHING`;
	}
}

export async function removeBookFromShelf(bookId: string, userId = DEFAULT_USER_ID): Promise<void> {
	const sql = getDb();
	if (!sql) return;

	await sql`
		DELETE FROM user_book
		WHERE userid = ${userId} AND (TRIM(bookid) = ${bookId} OR TRIM(userbookid) = ${bookId})
	`;
}

export async function createReadingSchedule(input: GenerateScheduleInput) {
	return mockGenerateSchedule(input);
}

export async function createReadingSession(
	input: LogSessionInput,
	userId = DEFAULT_USER_ID
): Promise<LogSessionResult> {
	const result = mockLogSession(input);
	const sql = getDb();
	if (!sql) return result;

	try {
		const [ub] = await sql`
			SELECT ub.userbookid AS "userBookId", ub.currentpage AS "currentPage", b.pagecount AS "pageCount"
			FROM user_book ub
			JOIN book b ON b.bookid = ub.bookid
			WHERE ub.userid = ${userId} AND (TRIM(ub.bookid) = ${input.bookId} OR TRIM(ub.userbookid) = ${input.bookId})
			LIMIT 1
		`;
		if (ub) {
			const [plCount] = await sql`SELECT COUNT(*)::int AS cnt FROM progress_log`;
			const plId = `PL${String(Number(plCount?.cnt ?? 10) + 1).padStart(8, '0')}`;
			const startPage = Number(ub.currentPage);
			const pagesRead = Math.max(1, Math.round(input.pagesRead));
			const currentPage = startPage + pagesRead;
			const newBookPage = Math.min(Number(ub.pageCount), currentPage);
			const newStatus = newBookPage >= Number(ub.pageCount) ? 'finished' : 'reading';

			await sql`
				INSERT INTO progress_log (progresslogid, userbookid, logdate, startpage, pagesread, currentpage, minutesread, note)
				VALUES (${plId}, ${ub.userBookId}, CURRENT_DATE, ${startPage}, ${pagesRead}, ${currentPage}, ${input.minutesRead ?? null}, ${input.notes ?? null})
			`;
			await sql`
				UPDATE user_book
				SET currentpage = ${newBookPage}, status = ${newStatus}
				WHERE userbookid = ${ub.userBookId}
			`;
		}
	} catch (err) {
		console.warn('[kutubuku/db] Log session fallback to mock:', err);
	}

	return result;
}
