import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Cookies } from '@sveltejs/kit';
import { Google } from 'arctic';
import { getDb } from '$lib/server/db';

export type SessionUser = NonNullable<App.Locals['user']>;

export const SESSION_COOKIE = 'kutubuku_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const OAUTH_PREFIX = 'oauth:google:';

function readEnv(key: string): string | undefined {
	const direct = process.env[key]?.trim();
	if (direct) return direct;

	try {
		const envPath = path.resolve(process.cwd(), '.env');
		if (!fs.existsSync(envPath)) return undefined;
		const content = fs.readFileSync(envPath, 'utf-8');
		const pattern = new RegExp(`^${key}\\s*=\\s*(.*)$`);
		for (const line of content.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const match = trimmed.match(pattern);
			if (match) {
				const raw = match[1].trim().replace(/^["']|["']$/g, '');
				if (raw) return raw;
			}
		}
	} catch {
		// Ignore fs errors in serverless environments
	}
	return undefined;
}

// In-memory fallback store when DATABASE_URL is not configured (dev/mock mode)
interface MockUserRecord {
	userId: string;
	userName: string;
	userEmail: string;
	role: 'user' | 'admin';
	passwordHash: string;
	timezone: string;
	maxConcurrentBooks: number;
	onboarded: boolean;
}

const mockUsers = new Map<string, MockUserRecord>();

function getAuthSecret(): string {
	return readEnv('AUTH_SECRET') || 'kutubuku-dev-secret-change-in-production';
}

export function isGoogleAuthConfigured(): boolean {
	return Boolean(readEnv('GOOGLE_CLIENT_ID') && readEnv('GOOGLE_CLIENT_SECRET'));
}

export function getGoogleClient(origin: string): Google | null {
	const clientId = readEnv('GOOGLE_CLIENT_ID');
	const clientSecret = readEnv('GOOGLE_CLIENT_SECRET');
	if (!clientId || !clientSecret) return null;

	const redirectUri = readEnv('GOOGLE_REDIRECT_URI') || `${origin}/auth/google/callback`;
	return new Google(clientId, clientSecret, redirectUri);
}

// --- Password Hashing (Node built-in scrypt) ---

export function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16).toString('hex');
	const derived = crypto.scryptSync(password, salt, 64).toString('hex');
	return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
	if (!storedHash || storedHash.startsWith(OAUTH_PREFIX)) return false;
	const parts = storedHash.split(':');
	if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

	const [, salt, keyHex] = parts;
	const derived = crypto.scryptSync(password, salt, 64);
	const expected = Buffer.from(keyHex, 'hex');
	if (derived.length !== expected.length) return false;
	return crypto.timingSafeEqual(derived, expected);
}

// --- Signed Session Cookies (HMAC-SHA256, no extra DB table needed) ---

function signPayload(payloadB64: string): string {
	return crypto.createHmac('sha256', getAuthSecret()).update(payloadB64).digest('base64url');
}

export function createSessionCookie(cookies: Cookies, userId: string, secure: boolean) {
	const payload = JSON.stringify({
		uid: userId.trim(),
		exp: Date.now() + SESSION_MAX_AGE * 1000
	});
	const payloadB64 = Buffer.from(payload).toString('base64url');
	const token = `${payloadB64}.${signPayload(payloadB64)}`;

	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: SESSION_MAX_AGE
	});
}

export function clearSessionCookie(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function readSessionUserId(cookies: Cookies): string | null {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;

	const dot = token.indexOf('.');
	if (dot === -1) return null;

	const payloadB64 = token.slice(0, dot);
	const sig = token.slice(dot + 1);
	const expectedSig = signPayload(payloadB64);

	const sigBuf = Buffer.from(sig);
	const expBuf = Buffer.from(expectedSig);
	if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
		return null;
	}

	try {
		const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as {
			uid?: string;
			exp?: number;
		};
		if (!parsed.uid || !parsed.exp || Date.now() > parsed.exp) return null;
		return parsed.uid;
	} catch {
		return null;
	}
}

// --- User Queries & Mutations (Postgres with Mock fallback) ---

async function generateNextId(prefix: 'US' | 'RC', table: 'app_user' | 'reading_challenge', col: string): Promise<string> {
	const sql = getDb();
	if (!sql) {
		const next = mockUsers.size + 100;
		return `${prefix}${String(next).padStart(8, '0')}`;
	}
	const [row] = await sql.unsafe(
		`SELECT COALESCE(MAX(SUBSTRING(${col} FROM 3)::int), 0) AS max_num FROM ${table}`
	);
	const nextNum = Number(row?.max_num ?? 0) + 1;
	return `${prefix}${String(nextNum).padStart(8, '0')}`;
}

export async function findUserById(userId: string): Promise<SessionUser | null> {
	const cleanId = userId.trim();
	const sql = getDb();
	if (!sql) {
		const found = mockUsers.get(cleanId);
		if (!found) return null;
		return {
			userId: found.userId,
			userName: found.userName,
			userEmail: found.userEmail,
			role: found.role,
			timezone: found.timezone,
			maxConcurrentBooks: found.maxConcurrentBooks,
			onboarded: found.onboarded
		};
	}

	const [row] = await sql`
		SELECT
			u.userid AS "userId",
			u.username AS "userName",
			u.useremail AS "userEmail",
			COALESCE(u.role, 'user') AS "role",
			u.timezone,
			u.maxconcurrentbooks AS "maxConcurrentBooks",
			EXISTS (
				SELECT 1 FROM reading_challenge rc WHERE rc.userid = u.userid
			) AS "onboarded"
		FROM app_user u
		WHERE u.userid = ${cleanId}
		LIMIT 1
	`;
	if (!row) return null;

	return {
		userId: String(row.userId).trim(),
		userName: row.userName,
		userEmail: row.userEmail,
		role: row.role === 'admin' ? 'admin' : 'user',
		timezone: row.timezone,
		maxConcurrentBooks: Number(row.maxConcurrentBooks),
		onboarded: Boolean(row.onboarded)
	};
}

export async function authenticateManualUser(
	email: string,
	password: string
): Promise<{ user?: SessionUser; error?: string }> {
	const normalizedEmail = email.trim().toLowerCase();
	const sql = getDb();

	if (!sql) {
		const found = [...mockUsers.values()].find((u) => u.userEmail === normalizedEmail);
		if (!found) return { error: 'Invalid email or password.' };
		if (found.passwordHash.startsWith(OAUTH_PREFIX)) {
			return { error: 'This account uses Google Sign-In. Click "Continue with Google" instead.' };
		}
		if (!verifyPassword(password, found.passwordHash)) {
			return { error: 'Invalid email or password.' };
		}
		return {
			user: {
				userId: found.userId,
				userName: found.userName,
				userEmail: found.userEmail,
				role: found.role,
				timezone: found.timezone,
				maxConcurrentBooks: found.maxConcurrentBooks,
				onboarded: found.onboarded
			}
		};
	}

	const [row] = await sql`
		SELECT
			u.userid AS "userId",
			u.username AS "userName",
			u.useremail AS "userEmail",
			COALESCE(u.role, 'user') AS "role",
			u.passwordhash AS "passwordHash",
			u.timezone,
			u.maxconcurrentbooks AS "maxConcurrentBooks",
			EXISTS (
				SELECT 1 FROM reading_challenge rc WHERE rc.userid = u.userid
			) AS "onboarded"
		FROM app_user u
		WHERE LOWER(u.useremail) = ${normalizedEmail}
		LIMIT 1
	`;

	if (!row) return { error: 'Invalid email or password.' };
	if (String(row.passwordHash).startsWith(OAUTH_PREFIX)) {
		return { error: 'This account uses Google Sign-In. Click "Continue with Google" instead.' };
	}
	if (!verifyPassword(password, String(row.passwordHash))) {
		return { error: 'Invalid email or password.' };
	}

	return {
		user: {
			userId: String(row.userId).trim(),
			userName: row.userName,
			userEmail: row.userEmail,
			role: row.role === 'admin' ? 'admin' : 'user',
			timezone: row.timezone,
			maxConcurrentBooks: Number(row.maxConcurrentBooks),
			onboarded: Boolean(row.onboarded)
		}
	};
}

export async function registerManualUser(input: {
	userName: string;
	userEmail: string;
	password: string;
}): Promise<{ user?: SessionUser; error?: string }> {
	const userName = input.userName.trim();
	const userEmail = input.userEmail.trim().toLowerCase();
	const passwordHash = hashPassword(input.password);
	const sql = getDb();

	if (!sql) {
		const exists = [...mockUsers.values()].some((u) => u.userEmail === userEmail);
		if (exists) return { error: 'An account with this email already exists.' };

		const userId = await generateNextId('US', 'app_user', 'userid');
		const record: MockUserRecord = {
			userId,
			userName,
			userEmail,
			role: 'user',
			passwordHash,
			timezone: 'Asia/Jakarta',
			maxConcurrentBooks: 3,
			onboarded: false
		};
		mockUsers.set(userId, record);
		return {
			user: {
				userId,
				userName,
				userEmail,
				role: 'user',
				timezone: record.timezone,
				maxConcurrentBooks: record.maxConcurrentBooks,
				onboarded: false
			}
		};
	}

	const [existing] = await sql`
		SELECT userid FROM app_user WHERE LOWER(useremail) = ${userEmail} LIMIT 1
	`;
	if (existing) {
		return { error: 'An account with this email already exists.' };
	}

	const userId = await generateNextId('US', 'app_user', 'userid');
	await sql`
		INSERT INTO app_user (userid, username, useremail, passwordhash)
		VALUES (${userId}, ${userName}, ${userEmail}, ${passwordHash})
	`;

	return {
		user: {
			userId,
			userName,
			userEmail,
			role: 'user',
			timezone: 'Asia/Jakarta',
			maxConcurrentBooks: 3,
			onboarded: false
		}
	};
}

export async function findOrCreateGoogleUser(input: {
	googleSub: string;
	email: string;
	name: string;
}): Promise<{ user: SessionUser; isNew: boolean }> {
	const userEmail = input.email.trim().toLowerCase();
	const fallbackName = input.name.trim() || userEmail.split('@')[0] || 'Reader';
	const oauthMarker = `${OAUTH_PREFIX}${input.googleSub}`;
	const sql = getDb();

	if (!sql) {
		const existing = [...mockUsers.values()].find((u) => u.userEmail === userEmail);
		if (existing) {
			return {
				user: {
					userId: existing.userId,
					userName: existing.userName,
					userEmail: existing.userEmail,
					role: existing.role,
					timezone: existing.timezone,
					maxConcurrentBooks: existing.maxConcurrentBooks,
					onboarded: existing.onboarded
				},
				isNew: false
			};
		}
		const userId = await generateNextId('US', 'app_user', 'userid');
		const record: MockUserRecord = {
			userId,
			userName: fallbackName,
			userEmail,
			role: 'user',
			passwordHash: oauthMarker,
			timezone: 'Asia/Jakarta',
			maxConcurrentBooks: 3,
			onboarded: false
		};
		mockUsers.set(userId, record);
		return {
			user: {
				userId,
				userName: fallbackName,
				userEmail,
				role: 'user',
				timezone: record.timezone,
				maxConcurrentBooks: record.maxConcurrentBooks,
				onboarded: false
			},
			isNew: true
		};
	}

	const [existing] = await sql`
		SELECT
			u.userid AS "userId",
			u.username AS "userName",
			u.useremail AS "userEmail",
			COALESCE(u.role, 'user') AS "role",
			u.timezone,
			u.maxconcurrentbooks AS "maxConcurrentBooks",
			EXISTS (
				SELECT 1 FROM reading_challenge rc WHERE rc.userid = u.userid
			) AS "onboarded"
		FROM app_user u
		WHERE LOWER(u.useremail) = ${userEmail}
		LIMIT 1
	`;

	if (existing) {
		return {
			user: {
				userId: String(existing.userId).trim(),
				userName: existing.userName,
				userEmail: existing.userEmail,
				role: existing.role === 'admin' ? 'admin' : 'user',
				timezone: existing.timezone,
				maxConcurrentBooks: Number(existing.maxConcurrentBooks),
				onboarded: Boolean(existing.onboarded)
			},
			isNew: false
		};
	}

	const userId = await generateNextId('US', 'app_user', 'userid');
	await sql`
		INSERT INTO app_user (userid, username, useremail, passwordhash)
		VALUES (${userId}, ${fallbackName}, ${userEmail}, ${oauthMarker})
	`;

	return {
		user: {
			userId,
			userName: fallbackName,
			userEmail,
			role: 'user',
			timezone: 'Asia/Jakarta',
			maxConcurrentBooks: 3,
			onboarded: false
		},
		isNew: true
	};
}

export async function completeUserOnboarding(input: {
	userId: string;
	userName: string;
	timezone: string;
	maxConcurrentBooks: number;
	targetBooks: number;
	targetPages: number;
}): Promise<void> {
	const cleanId = input.userId.trim();
	const userName = input.userName.trim();
	const timezone = input.timezone.trim() || 'Asia/Jakarta';
	const maxConcurrentBooks = Math.max(1, Math.min(10, Math.round(input.maxConcurrentBooks)));
	const targetBooks = Math.max(1, Math.round(input.targetBooks));
	const targetPages = Math.max(100, Math.round(input.targetPages));
	const year = new Date().getFullYear();

	const sql = getDb();
	if (!sql) {
		const existing = mockUsers.get(cleanId);
		if (existing) {
			existing.userName = userName;
			existing.timezone = timezone;
			existing.maxConcurrentBooks = maxConcurrentBooks;
			existing.onboarded = true;
		}
		return;
	}

	await sql`
		UPDATE app_user
		SET username = ${userName},
			timezone = ${timezone},
			maxconcurrentbooks = ${maxConcurrentBooks}
		WHERE userid = ${cleanId}
	`;

	const [existingChallenge] = await sql`
		SELECT challengeid FROM reading_challenge
		WHERE userid = ${cleanId} AND challengeyear = ${year}
		LIMIT 1
	`;

	if (existingChallenge) {
		await sql`
			UPDATE reading_challenge
			SET targetbooks = ${targetBooks}, targetpages = ${targetPages}
			WHERE challengeid = ${existingChallenge.challengeid}
		`;
	} else {
		const challengeId = await generateNextId('RC', 'reading_challenge', 'challengeid');
		await sql`
			INSERT INTO reading_challenge (challengeid, userid, challengeyear, targetbooks, targetpages)
			VALUES (${challengeId}, ${cleanId}, ${year}, ${targetBooks}, ${targetPages})
		`;
	}
}
