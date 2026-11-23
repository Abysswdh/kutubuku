import { json } from '@sveltejs/kit';
import { changeBookShelfStatus, createBookOnShelf } from '$lib/server/repository';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const book = await createBookOnShelf(body);
		return json({ ok: true, book });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to add book';
		return json({ ok: false, error: message }, { status: 400 });
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const book = await changeBookShelfStatus(body);
		return json({ ok: true, book });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to update book status';
		return json({ ok: false, error: message }, { status: 400 });
	}
};
