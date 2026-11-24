import { fail, redirect } from '@sveltejs/kit';
import { completeUserOnboarding } from '$lib/server/auth';
import { createBookOnShelf } from '$lib/server/repository';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/auth');
	}
	if (locals.user.onboarded) {
		redirect(303, '/');
	}
	return {
		user: locals.user,
		currentYear: new Date().getFullYear()
	};
};

export const actions: Actions = {
	complete: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/auth');
		}

		const data = await request.formData();
		const userName = String(data.get('userName') ?? '').trim();
		const timezone = String(data.get('timezone') ?? 'Asia/Jakarta').trim();
		const maxConcurrentBooks = Number(data.get('maxConcurrentBooks') ?? 3);
		const targetBooks = Number(data.get('targetBooks') ?? 12);
		const targetPages = Number(data.get('targetPages') ?? 3600);

		const firstBookTitle = String(data.get('firstBookTitle') ?? '').trim();
		const firstBookAuthor = String(data.get('firstBookAuthor') ?? '').trim();
		const firstBookPages = Number(data.get('firstBookPages') ?? 0);

		if (userName.length < 2 || userName.length > 100) {
			return fail(400, { error: 'Display name must be between 2 and 100 characters.' });
		}
		if (!Number.isFinite(targetBooks) || targetBooks < 1) {
			return fail(400, { error: 'Annual book target must be at least 1.' });
		}
		if (!Number.isFinite(targetPages) || targetPages < 100) {
			return fail(400, { error: 'Annual page target must be at least 100.' });
		}

		await completeUserOnboarding({
			userId: locals.user.userId,
			userName,
			timezone,
			maxConcurrentBooks,
			targetBooks,
			targetPages
		});

		if (firstBookTitle) {
			await createBookOnShelf(
				{
					title: firstBookTitle,
					author: firstBookAuthor || 'Unknown Author',
					totalPages: firstBookPages > 0 ? Math.round(firstBookPages) : 250,
					status: 'reading'
				},
				locals.user.userId
			);
		}

		redirect(303, '/');
	}
};
