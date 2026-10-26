import { error } from '@sveltejs/kit';
import { getBookById, getDailyGoal, getSessionsForBook, getUserStats } from '$lib/data/mock';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const book = getBookById(params.id);
	if (!book) {
		error(404, {
			message: `Book with ID "${params.id}" not found.`
		});
	}

	return {
		book,
		sessions: getSessionsForBook(params.id),
		dailyGoal: getDailyGoal(),
		stats: getUserStats()
	};
};
