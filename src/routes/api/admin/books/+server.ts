import { json } from '@sveltejs/kit';
import {
	adminCreateOfficialBook,
	adminModerateBook,
	type VerificationStatus
} from '$lib/server/catalog';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden: Admin access required' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const bookId = await adminCreateOfficialBook({
			title: String(body.title ?? ''),
			author: String(body.author ?? ''),
			publisher: String(body.publisher ?? ''),
			genre: String(body.genre ?? ''),
			isbn13: typeof body.isbn13 === 'string' ? body.isbn13 : undefined,
			pageCount: Number(body.pageCount)
		});
		return json({ ok: true, bookId });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to create official book';
		return json({ ok: false, error: message }, { status: 400 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden: Admin access required' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const status = body.verificationStatus as VerificationStatus;
		if (!['pending', 'verified', 'rejected'].includes(status)) {
			return json({ ok: false, error: 'Invalid verificationStatus' }, { status: 400 });
		}

		await adminModerateBook({
			bookId: String(body.bookId ?? ''),
			verificationStatus: status,
			title: typeof body.title === 'string' ? body.title : undefined,
			author: typeof body.author === 'string' ? body.author : undefined,
			publisher: typeof body.publisher === 'string' ? body.publisher : undefined,
			genre: typeof body.genre === 'string' ? body.genre : undefined,
			isbn13: typeof body.isbn13 === 'string' ? body.isbn13 : undefined,
			pageCount: body.pageCount !== undefined ? Number(body.pageCount) : undefined
		});
		return json({ ok: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to moderate book';
		return json({ ok: false, error: message }, { status: 400 });
	}
};
