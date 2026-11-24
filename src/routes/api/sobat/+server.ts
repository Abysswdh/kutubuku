import { json } from '@sveltejs/kit';
import { toggleCelebrateActivity, toggleFollowSobat } from '$lib/server/sobat';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		if (body.action === 'follow' && typeof body.sobatUserId === 'string') {
			const res = await toggleFollowSobat(locals.user.userId, body.sobatUserId);
			return json({ ok: true, ...res });
		}
		if (body.action === 'celebrate' && typeof body.activityKey === 'string') {
			const res = await toggleCelebrateActivity(locals.user.userId, body.activityKey);
			return json({ ok: true, ...res });
		}
		return json({ ok: false, error: 'Invalid action' }, { status: 400 });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Request failed';
		return json({ ok: false, error: message }, { status: 400 });
	}
};
