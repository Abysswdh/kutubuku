import { redirect } from '@sveltejs/kit';
import { fetchReadingChallenge } from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/auth');
	}
	const challenge = await fetchReadingChallenge(locals.user.userId);
	return {
		user: locals.user,
		challenge,
		currentYear: new Date().getFullYear(),
		lang: locals.lang
	};
};
