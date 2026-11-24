import { getDb } from '$lib/server/db';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface CatalogBook {
	bookId: string;
	title: string;
	author: string;
	publisher: string;
	genre: string;
	isbn13: string | null;
	pageCount: number;
	verificationStatus: VerificationStatus;
	onShelf: boolean;
}

export interface PublicProfileData {
	userId: string;
	userName: string;
	initials: string;
	streakDays: number;
	longestStreak: number;
	totalXp: number;
	currentLevel: number;
	memberSince: string;
	challenge: {
		year: number;
		targetBooks: number;
		completedBooks: number;
		targetPages: number;
		completedPages: number;
	} | null;
	badges: { id: string; title: string; description: string }[];
	books: {
		bookId: string;
		title: string;
		author: string;
		genre: string;
		status: string;
		currentPage: number;
		totalPages: number;
	}[];
}

export interface AdminStats {
	pendingBooks: number;
	verifiedBooks: number;
	totalUsers: number;
	totalPagesLogged: number;
}

function getInitials(name: string): string {
	return (
		name
			.trim()
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0]?.toUpperCase() ?? '')
			.join('') || 'KB'
	);
}

async function resolveOrCreatePublisher(publisherName: string): Promise<string> {
	const sql = getDb()!;
	const clean = publisherName.trim() || 'Independent Press';
	const [existing] = await sql`
		SELECT publisherid FROM publisher WHERE LOWER(publishername) = ${clean.toLowerCase()} LIMIT 1
	`;
	if (existing?.publisherid) return String(existing.publisherid).trim();

	const [maxRow] = await sql`SELECT COALESCE(MAX(SUBSTRING(publisherid FROM 3)::int), 0) AS max_num FROM publisher`;
	const publisherId = `PU${String(Number(maxRow?.max_num ?? 0) + 1).padStart(8, '0')}`;
	await sql`INSERT INTO publisher (publisherid, publishername) VALUES (${publisherId}, ${clean})`;
	return publisherId;
}

async function resolveOrCreateAuthor(authorName: string): Promise<string | null> {
	const sql = getDb()!;
	const clean = authorName.trim();
	if (!clean || clean === 'Unknown Author') return null;

	const [existing] = await sql`
		SELECT authorid FROM author WHERE LOWER(authorname) = ${clean.toLowerCase()} LIMIT 1
	`;
	if (existing?.authorid) return String(existing.authorid).trim();

	const [maxRow] = await sql`SELECT COALESCE(MAX(SUBSTRING(authorid FROM 3)::int), 0) AS max_num FROM author`;
	const authorId = `AU${String(Number(maxRow?.max_num ?? 0) + 1).padStart(8, '0')}`;
	await sql`INSERT INTO author (authorid, authorname) VALUES (${authorId}, ${clean})`;
	return authorId;
}

async function resolveOrCreateGenre(genreName: string): Promise<string | null> {
	const sql = getDb()!;
	const clean = genreName.trim();
	if (!clean) return null;

	const [existing] = await sql`
		SELECT genreid FROM genre WHERE LOWER(genrename) = ${clean.toLowerCase()} LIMIT 1
	`;
	if (existing?.genreid) return String(existing.genreid).trim();

	const [maxRow] = await sql`SELECT COALESCE(MAX(SUBSTRING(genreid FROM 3)::int), 0) AS max_num FROM genre`;
	const genreId = `GN${String(Number(maxRow?.max_num ?? 0) + 1).padStart(8, '0')}`;
	await sql`INSERT INTO genre (genreid, genrename) VALUES (${genreId}, ${clean})`;
	return genreId;
}

export async function fetchVerifiedCatalog(userId?: string, limit = 60): Promise<CatalogBook[]> {
	const sql = getDb();
	if (!sql) return [];

	const cleanUserId = userId?.trim() || null;
	const rows = await sql`
		SELECT
			b.bookid AS "bookId",
			b.title,
			b.isbn13,
			b.pagecount AS "pageCount",
			COALESCE(b.verificationstatus, 'verified') AS "verificationStatus",
			COALESCE(p.publishername, 'Independent Press') AS "publisher",
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
				NULLIF(b.description, ''),
				'General'
			) AS "genre",
			CASE
				WHEN ${cleanUserId}::char(10) IS NULL THEN false
				ELSE EXISTS (
					SELECT 1 FROM user_book ub
					WHERE ub.userid = ${cleanUserId} AND ub.bookid = b.bookid
				)
			END AS "onShelf"
		FROM book b
		LEFT JOIN publisher p ON p.publisherid = b.publisherid
		WHERE COALESCE(b.verificationstatus, 'verified') = 'verified'
		ORDER BY b.bookid DESC
		LIMIT ${limit}
	`;

	return rows.map((r) => ({
		bookId: String(r.bookId).trim(),
		title: r.title,
		author: r.author,
		publisher: r.publisher,
		genre: r.genre,
		isbn13: r.isbn13 ? String(r.isbn13).trim() : null,
		pageCount: Number(r.pageCount),
		verificationStatus: 'verified',
		onShelf: Boolean(r.onShelf)
	}));
}

export async function addExistingCatalogBookToShelf(
	bookId: string,
	userId: string,
	status: 'reading' | 'planned' = 'planned'
): Promise<void> {
	const sql = getDb();
	if (!sql) return;

	const cleanBookId = bookId.trim();
	const cleanUserId = userId.trim();

	const [existing] = await sql`
		SELECT userbookid FROM user_book
		WHERE userid = ${cleanUserId} AND bookid = ${cleanBookId}
		  AND status IN ('planned', 'reading', 'paused')
		LIMIT 1
	`;
	if (existing) return;

	const [ubMax] = await sql`SELECT COALESCE(MAX(SUBSTRING(userbookid FROM 3)::int), 0) AS max_num FROM user_book`;
	const userBookId = `UB${String(Number(ubMax?.max_num ?? 0) + 1).padStart(8, '0')}`;

	await sql`
		INSERT INTO user_book (userbookid, userid, bookid, status, currentpage, startdate)
		VALUES (${userBookId}, ${cleanUserId}, ${cleanBookId}, ${status}, 0, ${status === 'reading' ? new Date().toISOString().split('T')[0] : null})
	`;
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfileData | null> {
	const sql = getDb();
	if (!sql) return null;

	const cleanId = userId.trim();
	const [user] = await sql`
		SELECT
			u.userid AS "userId",
			u.username AS "userName",
			u.currentstreak AS "streakDays",
			u.longeststreak AS "longestStreak",
			u.registerdate AS "registerDate",
			COALESCE((
				SELECT SUM(pl.pagesread * 1 + 10)
				FROM progress_log pl
				JOIN user_book ub ON ub.userbookid = pl.userbookid
				WHERE ub.userid = u.userid
			), 0) AS "totalXp"
		FROM app_user u
		WHERE u.userid = ${cleanId}
		LIMIT 1
	`;
	if (!user) return null;

	const [challengeRows, badgeRows, bookRows] = await Promise.all([
		sql`
			SELECT
				rc.challengeyear AS "year",
				COALESCE(rc.targetbooks, 12) AS "targetBooks",
				COALESCE(rc.targetpages, 3600) AS "targetPages",
				(SELECT COUNT(*)::int FROM user_book ub WHERE ub.userid = rc.userid AND ub.status = 'finished') AS "completedBooks",
				COALESCE((SELECT SUM(ub.currentpage)::int FROM user_book ub WHERE ub.userid = rc.userid), 0) AS "completedPages"
			FROM reading_challenge rc
			WHERE rc.userid = ${cleanId}
			ORDER BY rc.challengeyear DESC
			LIMIT 1
		`,
		sql`
			SELECT b.badgeid AS "id", b.badgename AS "title", b.description
			FROM user_badge ub
			JOIN badge b ON b.badgeid = ub.badgeid
			WHERE ub.userid = ${cleanId}
			ORDER BY ub.awardedat DESC
		`,
		sql`
			SELECT
				b.bookid AS "bookId",
				b.title,
				b.pagecount AS "totalPages",
				ub.currentpage AS "currentPage",
				ub.status,
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
					NULLIF(b.description, ''),
					'General'
				) AS "genre"
			FROM user_book ub
			JOIN book b ON b.bookid = ub.bookid
			WHERE ub.userid = ${cleanId} AND ub.status IN ('reading', 'finished')
			ORDER BY ub.status DESC, ub.addedat DESC
			LIMIT 12
		`
	]);

	const totalXp = Number(user.totalXp) || 0;
	const currentLevel = Math.floor(totalXp / 200) + 1;
	const ch = challengeRows[0];

	return {
		userId: String(user.userId).trim(),
		userName: user.userName,
		initials: getInitials(user.userName),
		streakDays: Number(user.streakDays),
		longestStreak: Number(user.longestStreak),
		totalXp,
		currentLevel,
		memberSince: new Date(user.registerDate).toISOString().split('T')[0],
		challenge: ch
			? {
					year: Number(ch.year),
					targetBooks: Number(ch.targetBooks),
					completedBooks: Number(ch.completedBooks),
					targetPages: Number(ch.targetPages),
					completedPages: Number(ch.completedPages)
				}
			: null,
		badges: badgeRows.map((b) => ({
			id: String(b.id).trim(),
			title: b.title,
			description: b.description
		})),
		books: bookRows.map((b) => ({
			bookId: String(b.bookId).trim(),
			title: b.title,
			author: b.author,
			genre: b.genre,
			status: b.status,
			currentPage: Number(b.currentPage),
			totalPages: Number(b.totalPages)
		}))
	};
}

export async function fetchAdminDashboard(): Promise<{
	stats: AdminStats;
	books: CatalogBook[];
}> {
	const sql = getDb();
	if (!sql) {
		return {
			stats: { pendingBooks: 0, verifiedBooks: 0, totalUsers: 0, totalPagesLogged: 0 },
			books: []
		};
	}

	const [statsRows, bookRows] = await Promise.all([
		sql`
			SELECT
				(SELECT COUNT(*)::int FROM book WHERE verificationstatus = 'pending') AS "pendingBooks",
				(SELECT COUNT(*)::int FROM book WHERE COALESCE(verificationstatus, 'verified') = 'verified') AS "verifiedBooks",
				(SELECT COUNT(*)::int FROM app_user) AS "totalUsers",
				COALESCE((SELECT SUM(pagesread)::int FROM progress_log), 0) AS "totalPagesLogged"
		`,
		sql`
			SELECT
				b.bookid AS "bookId",
				b.title,
				b.isbn13,
				b.pagecount AS "pageCount",
				COALESCE(b.verificationstatus, 'verified') AS "verificationStatus",
				COALESCE(p.publishername, 'Independent Press') AS "publisher",
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
					NULLIF(b.description, ''),
					'General'
				) AS "genre"
			FROM book b
			LEFT JOIN publisher p ON p.publisherid = b.publisherid
			ORDER BY
				CASE COALESCE(b.verificationstatus, 'verified')
					WHEN 'pending' THEN 0
					WHEN 'verified' THEN 1
					ELSE 2
				END,
				b.bookid DESC
			LIMIT 100
		`
	]);

	const s = statsRows[0];
	return {
		stats: {
			pendingBooks: Number(s?.pendingBooks ?? 0),
			verifiedBooks: Number(s?.verifiedBooks ?? 0),
			totalUsers: Number(s?.totalUsers ?? 0),
			totalPagesLogged: Number(s?.totalPagesLogged ?? 0)
		},
		books: bookRows.map((r) => ({
			bookId: String(r.bookId).trim(),
			title: r.title,
			author: r.author,
			publisher: r.publisher,
			genre: r.genre,
			isbn13: r.isbn13 ? String(r.isbn13).trim() : null,
			pageCount: Number(r.pageCount),
			verificationStatus: (r.verificationStatus as VerificationStatus) ?? 'verified',
			onShelf: false
		}))
	};
}

export async function adminCreateOfficialBook(input: {
	title: string;
	author: string;
	publisher: string;
	genre: string;
	isbn13?: string;
	pageCount: number;
}): Promise<string> {
	const sql = getDb();
	if (!sql) throw new Error('Database not connected.');

	const title = input.title.trim();
	const pageCount = Math.max(1, Math.round(input.pageCount));
	const cleanIsbn = input.isbn13?.replace(/\D/g, '') || null;
	if (!title) throw new Error('Title is required.');
	if (cleanIsbn && cleanIsbn.length !== 13) {
		throw new Error('ISBN-13 must be exactly 13 digits.');
	}

	const [bookMax] = await sql`SELECT COALESCE(MAX(SUBSTRING(bookid FROM 3)::int), 0) AS max_num FROM book`;
	const bookId = `BK${String(Number(bookMax?.max_num ?? 0) + 1).padStart(8, '0')}`;
	const publisherId = await resolveOrCreatePublisher(input.publisher);

	await sql`
		INSERT INTO book (bookid, publisherid, title, isbn13, pagecount, description, verificationstatus)
		VALUES (${bookId}, ${publisherId}, ${title}, ${cleanIsbn}, ${pageCount}, ${input.genre.trim() || 'General'}, 'verified')
	`;

	const authorId = await resolveOrCreateAuthor(input.author);
	if (authorId) {
		await sql`INSERT INTO book_author (bookid, authorid) VALUES (${bookId}, ${authorId}) ON CONFLICT DO NOTHING`;
	}

	const genreId = await resolveOrCreateGenre(input.genre);
	if (genreId) {
		await sql`INSERT INTO book_genre (bookid, genreid) VALUES (${bookId}, ${genreId}) ON CONFLICT DO NOTHING`;
	}

	return bookId;
}

export async function adminModerateBook(input: {
	bookId: string;
	verificationStatus: VerificationStatus;
	title?: string;
	author?: string;
	publisher?: string;
	genre?: string;
	isbn13?: string;
	pageCount?: number;
}): Promise<void> {
	const sql = getDb();
	if (!sql) throw new Error('Database not connected.');

	const bookId = input.bookId.trim();
	const cleanIsbn =
		input.isbn13 !== undefined ? input.isbn13.replace(/\D/g, '') || null : undefined;
	if (cleanIsbn && cleanIsbn.length !== 13) {
		throw new Error('ISBN-13 must be exactly 13 digits.');
	}

	const publisherId = input.publisher ? await resolveOrCreatePublisher(input.publisher) : undefined;

	await sql`
		UPDATE book
		SET
			verificationstatus = ${input.verificationStatus},
			title = COALESCE(${input.title?.trim() || null}, title),
			pagecount = COALESCE(${input.pageCount ? Math.max(1, Math.round(input.pageCount)) : null}, pagecount),
			publisherid = COALESCE(${publisherId ?? null}, publisherid),
			description = COALESCE(${input.genre?.trim() || null}, description),
			isbn13 = ${cleanIsbn !== undefined ? cleanIsbn : sql`isbn13`}
		WHERE bookid = ${bookId}
	`;

	if (input.author) {
		const authorId = await resolveOrCreateAuthor(input.author);
		if (authorId) {
			await sql`DELETE FROM book_author WHERE bookid = ${bookId}`;
			await sql`INSERT INTO book_author (bookid, authorid) VALUES (${bookId}, ${authorId}) ON CONFLICT DO NOTHING`;
		}
	}

	if (input.genre) {
		const genreId = await resolveOrCreateGenre(input.genre);
		if (genreId) {
			await sql`DELETE FROM book_genre WHERE bookid = ${bookId}`;
			await sql`INSERT INTO book_genre (bookid, genreid) VALUES (${bookId}, ${genreId}) ON CONFLICT DO NOTHING`;
		}
	}
}
