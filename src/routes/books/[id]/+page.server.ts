import { error } from '@sveltejs/kit';
import {
	fetchBookById,
	fetchDailyGoal,
	fetchSessionsForBook,
	fetchUserStats
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user?.userId;
	const book = await fetchBookById(params.id, userId);
	if (!book) {
		error(404, {
			message: `Book with ID "${params.id}" not found.`
		});
	}

	const [sessions, dailyGoal, stats] = await Promise.all([
		fetchSessionsForBook(params.id, userId),
		fetchDailyGoal(userId),
		fetchUserStats(userId)
	]);

	return {
		book,
		sessions,
		dailyGoal,
		stats
	};
};
