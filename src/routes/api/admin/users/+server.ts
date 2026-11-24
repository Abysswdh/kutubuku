import { json } from '@sveltejs/kit';
import { adminSetUserRole } from '$lib/server/catalog';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden: Admin access required' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const userId = String(body.userId ?? '').trim();
		const role = body.role;
		if (!userId || (role !== 'user' && role !== 'admin')) {
			return json({ ok: false, error: 'Invalid userId or role' }, { status: 400 });
		}

		await adminSetUserRole(userId, role, locals.user.userId);
		return json({ ok: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to update user role';
		return json({ ok: false, error: message }, { status: 400 });
	}
};
