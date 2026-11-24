import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

/**
 * Singleton PostgreSQL connection for Supabase (compatible with Vercel Serverless Transaction Pooler).
 * Returns `null` when `DATABASE_URL` is not configured in `.env`, allowing seamless fallback to mock.ts.
 */
let sqlInstance: ReturnType<typeof postgres> | null = null;

function resolveDatabaseUrl(): string | null {
	if (process.env.DATABASE_URL?.trim()) {
		return process.env.DATABASE_URL.trim();
	}

	// Fallback: read local .env file during Vite dev if process.env wasn't pre-populated
	try {
		const envPath = path.resolve(process.cwd(), '.env');
		if (fs.existsSync(envPath)) {
			const content = fs.readFileSync(envPath, 'utf-8');
			for (const line of content.split(/\r?\n/)) {
				const trimmed = line.trim();
				if (!trimmed || trimmed.startsWith('#')) continue;
				const match = trimmed.match(/^DATABASE_URL\s*=\s*(.*)$/);
				if (match) {
					const raw = match[1].trim().replace(/^["']|["']$/g, '');
					if (raw) return raw;
				}
				if (trimmed.startsWith('postgresql://') || trimmed.startsWith('postgres://')) {
					return trimmed.replace(/^["']|["']$/g, '');
				}
			}
		}
	} catch {
		// Ignore fs errors in serverless environments
	}

	return null;
}

export function getDb(): ReturnType<typeof postgres> | null {
	const dbUrl = resolveDatabaseUrl();
	if (!dbUrl) {
		return null;
	}
	if (!sqlInstance) {
		// prepare: false & max_pipeline: 1 are required for Supabase Transaction Pooler (port 6543) on Vercel Serverless
		sqlInstance = postgres(dbUrl, {
			prepare: false,
			max: 3,
			max_pipeline: 1,
			idle_timeout: 5,
			connect_timeout: 10,
			max_lifetime: 300
		});
	}
	return sqlInstance;
}
