import { error } from '@sveltejs/kit';
import {
	fetchBookById,
	fetchDailyGoal,
	fetchSessionsForBook,
	fetchUserStats
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const book = await fetchBookById(params.id);
	if (!book) {
		error(404, {
			message: `Book with ID "${params.id}" not found.`
		});
	}

	const [sessions, dailyGoal, stats] = await Promise.all([
		fetchSessionsForBook(params.id),
		fetchDailyGoal(),
		fetchUserStats()
	]);

	return {
		book,
		sessions,
		dailyGoal,
		stats
	};
};
