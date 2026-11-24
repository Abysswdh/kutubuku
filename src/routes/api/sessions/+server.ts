import { json } from '@sveltejs/kit';
import { createReadingSession } from '$lib/server/repository';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const result = await createReadingSession(body, locals.user?.userId);
		return json({ ok: true, result });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to log session';
		return json({ ok: false, error: message }, { status: 400 });
	}
};
