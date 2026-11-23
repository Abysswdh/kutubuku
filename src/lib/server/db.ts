import postgres from 'postgres';

/**
 * Singleton PostgreSQL connection for Supabase (compatible with Vercel Serverless Transaction Pooler).
 * Returns `null` when `DATABASE_URL` is not configured in `.env`, allowing seamless fallback to mock.ts.
 */
let sqlInstance: ReturnType<typeof postgres> | null = null;

export function getDb(): ReturnType<typeof postgres> | null {
	const dbUrl = process.env.DATABASE_URL?.trim();
	if (!dbUrl) {
		return null;
	}
	if (!sqlInstance) {
		// prepare: false is required for Supabase Transaction Pooler (port 6543) on Vercel Serverless
		sqlInstance = postgres(dbUrl, {
			prepare: false,
			max: 5,
			idle_timeout: 20
		});
	}
	return sqlInstance;
}
