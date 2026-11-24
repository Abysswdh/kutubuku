import { json } from '@sveltejs/kit';
import { adminCreateBadge, adminDeleteBadge } from '$lib/server/catalog';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden: Admin access required' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const badgeId = await adminCreateBadge({
			badgeName: String(body.badgeName ?? ''),
			description: String(body.description ?? ''),
			criteriaType: body.criteriaType,
			criteriaValue: Number(body.criteriaValue)
		});
		return json({ ok: true, badgeId });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to create badge';
		return json({ ok: false, error: message }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden: Admin access required' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const badgeId = String(body.badgeId ?? '').trim();
		if (!badgeId) {
			return json({ ok: false, error: 'badgeId is required' }, { status: 400 });
		}
		await adminDeleteBadge(badgeId);
		return json({ ok: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to delete badge';
		return json({ ok: false, error: message }, { status: 400 });
	}
};
