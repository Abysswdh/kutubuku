import { getDb } from '$lib/server/db';
import { getBroUpdates as mockGetBroUpdates } from '$lib/data/mock';

export interface SobatFeedItem {
	activityKey: string;
	userId: string;
	userName: string;
	avatarInitials: string;
	avatarBg: string;
	isSelf: boolean;
	message: string;
	subtext?: string;
	badgeEmoji: string;
	timeAgo: string;
	celebrations: number;
	hasCelebrated: boolean;
}

export interface SobatLeaderboardRow {
	userId: string;
	userName: string;
	avatarInitials: string;
	avatarBg: string;
	isSelf: boolean;
	weeklyPages: number;
	streakDays: number;
	booksFinished: number;
}

export interface SobatDirectoryUser {
	userId: string;
	userName: string;
	userEmail: string;
	avatarInitials: string;
	avatarBg: string;
	isFollowing: boolean;
	streakDays: number;
	booksFinished: number;
	currentBookTitle: string | null;
}

const AVATAR_PALETTE = ['#0f766e', '#b45309', '#1d4ed8', '#7e22ce', '#be123c', '#047857'];

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return 'KB';
	return parts
		.slice(0, 2)
		.map((p) => p[0]?.toUpperCase() ?? '')
		.join('');
}

function getAvatarBg(userId: string): string {
	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
	}
	return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function formatTimeAgo(input: Date | string): string {
	const date = input instanceof Date ? input : new Date(input);
	const diffMs = Math.max(0, Date.now() - date.getTime());
	const mins = Math.floor(diffMs / 60_000);
	if (mins < 2) return 'Just now';
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days === 1) return '1 day ago';
	if (days < 30) return `${days} days ago`;
	return date.toISOString().split('T')[0];
}

export async function fetchSobatFeed(userId: string): Promise<SobatFeedItem[]> {
	const sql = getDb();
	if (!sql) {
		return mockGetBroUpdates().map((m) => ({
			activityKey: m.id,
			userId: 'US00000001',
			userName: m.userName,
			avatarInitials: m.avatarInitials,
			avatarBg: m.avatarBg,
			isSelf: false,
			message: m.message,
			badgeEmoji: m.badgeEmoji,
			timeAgo: m.timeAgo,
			celebrations: m.celebrations,
			hasCelebrated: m.hasCelebrated
		}));
	}

	const cleanId = userId.trim();
	const rows = await sql`
		WITH circle AS (
			SELECT ${cleanId}::char(10) AS userid
			UNION
			SELECT sobatuserid AS userid FROM user_sobat WHERE userid = ${cleanId}
		),
		events AS (
			SELECT
				('finished:' || TRIM(ub.userbookid)) AS activity_key,
				ub.userid,
				u.username,
				('Finished reading "' || b.title || '"!') AS message,
				NULL::text AS subtext,
				'🏆' AS badge_emoji,
				COALESCE(ub.enddate::timestamp, ub.addedat) AS occurred_at
			FROM user_book ub
			JOIN circle c ON c.userid = ub.userid
			JOIN app_user u ON u.userid = ub.userid
			JOIN book b ON b.bookid = ub.bookid
			WHERE ub.status = 'finished'

			UNION ALL

			SELECT
				('log:' || TRIM(pl.progresslogid)) AS activity_key,
				ub.userid,
				u.username,
				('Read ' || pl.pagesread || ' pages of "' || b.title || '"') AS message,
				pl.note AS subtext,
				CASE WHEN pl.pagesread >= 40 THEN '🔥' ELSE '📖' END AS badge_emoji,
				pl.createdat AS occurred_at
			FROM progress_log pl
			JOIN user_book ub ON ub.userbookid = pl.userbookid
			JOIN circle c ON c.userid = ub.userid
			JOIN app_user u ON u.userid = ub.userid
			JOIN book b ON b.bookid = ub.bookid

			UNION ALL

			SELECT
				('badge:' || TRIM(ubg.userid) || ':' || TRIM(ubg.badgeid)) AS activity_key,
				ubg.userid,
				u.username,
				('Unlocked the "' || bg.badgename || '" badge!') AS message,
				bg.description AS subtext,
				'⚡' AS badge_emoji,
				ubg.awardedat AS occurred_at
			FROM user_badge ubg
			JOIN circle c ON c.userid = ubg.userid
			JOIN app_user u ON u.userid = ubg.userid
			JOIN badge bg ON bg.badgeid = ubg.badgeid
		)
		SELECT
			e.activity_key AS "activityKey",
			e.userid AS "userId",
			e.username AS "userName",
			e.message,
			e.subtext,
			e.badge_emoji AS "badgeEmoji",
			e.occurred_at AS "occurredAt",
			COALESCE((
				SELECT COUNT(*)::int FROM sobat_celebration sc
				WHERE sc.activitykey = e.activity_key
			), 0) AS "celebrations",
			EXISTS (
				SELECT 1 FROM sobat_celebration sc
				WHERE sc.activitykey = e.activity_key AND sc.userid = ${cleanId}
			) AS "hasCelebrated"
		FROM events e
		ORDER BY e.occurred_at DESC
		LIMIT 25
	`;

	return rows.map((r) => {
		const uid = String(r.userId).trim();
		return {
			activityKey: String(r.activityKey),
			userId: uid,
			userName: r.userName,
			avatarInitials: getInitials(r.userName),
			avatarBg: getAvatarBg(uid),
			isSelf: uid === cleanId,
			message: r.message,
			subtext: r.subtext ?? undefined,
			badgeEmoji: r.badgeEmoji,
			timeAgo: formatTimeAgo(r.occurredAt),
			celebrations: Number(r.celebrations),
			hasCelebrated: Boolean(r.hasCelebrated)
		};
	});
}

export async function fetchSobatLeaderboard(userId: string): Promise<SobatLeaderboardRow[]> {
	const sql = getDb();
	if (!sql) return [];

	const cleanId = userId.trim();
	const rows = await sql`
		WITH circle AS (
			SELECT ${cleanId}::char(10) AS userid
			UNION
			SELECT sobatuserid AS userid FROM user_sobat WHERE userid = ${cleanId}
		)
		SELECT
			u.userid AS "userId",
			u.username AS "userName",
			u.currentstreak AS "streakDays",
			COALESCE((
				SELECT SUM(pl.pagesread)::int
				FROM progress_log pl
				JOIN user_book ub ON ub.userbookid = pl.userbookid
				WHERE ub.userid = u.userid AND pl.logdate >= CURRENT_DATE - INTERVAL '6 days'
			), 0) AS "weeklyPages",
			COALESCE((
				SELECT COUNT(*)::int
				FROM user_book ub
				WHERE ub.userid = u.userid AND ub.status = 'finished'
			), 0) AS "booksFinished"
		FROM app_user u
		JOIN circle c ON c.userid = u.userid
		ORDER BY "weeklyPages" DESC, "streakDays" DESC, "booksFinished" DESC, u.username ASC
	`;

	return rows.map((r) => {
		const uid = String(r.userId).trim();
		return {
			userId: uid,
			userName: r.userName,
			avatarInitials: getInitials(r.userName),
			avatarBg: getAvatarBg(uid),
			isSelf: uid === cleanId,
			weeklyPages: Number(r.weeklyPages),
			streakDays: Number(r.streakDays),
			booksFinished: Number(r.booksFinished)
		};
	});
}

export async function fetchSobatDirectory(userId: string): Promise<SobatDirectoryUser[]> {
	const sql = getDb();
	if (!sql) return [];

	const cleanId = userId.trim();
	const rows = await sql`
		SELECT
			u.userid AS "userId",
			u.username AS "userName",
			u.useremail AS "userEmail",
			u.currentstreak AS "streakDays",
			EXISTS (
				SELECT 1 FROM user_sobat us
				WHERE us.userid = ${cleanId} AND us.sobatuserid = u.userid
			) AS "isFollowing",
			COALESCE((
				SELECT COUNT(*)::int
				FROM user_book ub
				WHERE ub.userid = u.userid AND ub.status = 'finished'
			), 0) AS "booksFinished",
			(
				SELECT b.title
				FROM user_book ub
				JOIN book b ON b.bookid = ub.bookid
				WHERE ub.userid = u.userid AND ub.status = 'reading'
				ORDER BY ub.addedat DESC
				LIMIT 1
			) AS "currentBookTitle"
		FROM app_user u
		WHERE u.userid <> ${cleanId}
		ORDER BY "isFollowing" DESC, u.currentstreak DESC, u.username ASC
		LIMIT 50
	`;

	return rows.map((r) => {
		const uid = String(r.userId).trim();
		return {
			userId: uid,
			userName: r.userName,
			userEmail: r.userEmail,
			avatarInitials: getInitials(r.userName),
			avatarBg: getAvatarBg(uid),
			isFollowing: Boolean(r.isFollowing),
			streakDays: Number(r.streakDays),
			booksFinished: Number(r.booksFinished),
			currentBookTitle: r.currentBookTitle ?? null
		};
	});
}

export async function toggleFollowSobat(
	userId: string,
	sobatUserId: string
): Promise<{ isFollowing: boolean }> {
	const cleanId = userId.trim();
	const cleanSobatId = sobatUserId.trim();
	if (!cleanSobatId || cleanId === cleanSobatId) {
		throw new Error('Invalid sobat ID.');
	}

	const sql = getDb();
	if (!sql) return { isFollowing: true };

	const [existing] = await sql`
		SELECT 1 FROM user_sobat
		WHERE userid = ${cleanId} AND sobatuserid = ${cleanSobatId}
		LIMIT 1
	`;

	if (existing) {
		await sql`
			DELETE FROM user_sobat
			WHERE userid = ${cleanId} AND sobatuserid = ${cleanSobatId}
		`;
		return { isFollowing: false };
	}

	await sql`
		INSERT INTO user_sobat (userid, sobatuserid)
		VALUES (${cleanId}, ${cleanSobatId})
		ON CONFLICT DO NOTHING
	`;
	return { isFollowing: true };
}

export async function toggleCelebrateActivity(
	userId: string,
	activityKey: string
): Promise<{ hasCelebrated: boolean; celebrations: number }> {
	const cleanId = userId.trim();
	const cleanKey = activityKey.trim().slice(0, 64);
	if (!cleanKey) throw new Error('Invalid activity key.');

	const sql = getDb();
	if (!sql) return { hasCelebrated: true, celebrations: 1 };

	const [existing] = await sql`
		SELECT 1 FROM sobat_celebration
		WHERE userid = ${cleanId} AND activitykey = ${cleanKey}
		LIMIT 1
	`;

	let hasCelebrated: boolean;
	if (existing) {
		await sql`
			DELETE FROM sobat_celebration
			WHERE userid = ${cleanId} AND activitykey = ${cleanKey}
		`;
		hasCelebrated = false;
	} else {
		await sql`
			INSERT INTO sobat_celebration (userid, activitykey)
			VALUES (${cleanId}, ${cleanKey})
			ON CONFLICT DO NOTHING
		`;
		hasCelebrated = true;
	}

	const [countRow] = await sql`
		SELECT COUNT(*)::int AS cnt FROM sobat_celebration
		WHERE activitykey = ${cleanKey}
	`;

	return {
		hasCelebrated,
		celebrations: Number(countRow?.cnt ?? 0)
	};
}
