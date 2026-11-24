import { json } from '@sveltejs/kit';
import {
	changeBookShelfStatus,
	createBookOnShelf,
	removeBookFromShelf,
	updateBookDetails
} from '$lib/server/repository';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const book = await createBookOnShelf(body, locals.user?.userId);
		return json({ ok: true, book });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to add book';
		return json({ ok: false, error: message }, { status: 400 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const book = await changeBookShelfStatus(body, locals.user?.userId);
		return json({ ok: true, book });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to update book status';
		return json({ ok: false, error: message }, { status: 400 });
	}
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		await updateBookDetails(
			{
				bookId: String(body.bookId ?? ''),
				title: String(body.title ?? ''),
				author: typeof body.author === 'string' ? body.author : undefined,
				totalPages: Number(body.totalPages),
				currentPage: body.currentPage !== undefined ? Number(body.currentPage) : undefined,
				genre: typeof body.genre === 'string' ? body.genre : undefined
			},
			locals.user?.userId
		);
		return json({ ok: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to update book';
		return json({ ok: false, error: message }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const bookId = String(body.bookId ?? '').trim();
		if (!bookId) {
			return json({ ok: false, error: 'bookId is required' }, { status: 400 });
		}
		await removeBookFromShelf(bookId, locals.user?.userId);
		return json({ ok: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to remove book';
		return json({ ok: false, error: message }, { status: 400 });
	}
};
