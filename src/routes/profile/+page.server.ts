import {
	fetchBadges,
	fetchBooks,
	fetchReadingChallenge,
	fetchRecentSessions,
	fetchUserStats
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.userId;
	const [stats, challenge, badges, books, recentSessions] = await Promise.all([
		fetchUserStats(userId),
		fetchReadingChallenge(userId),
		fetchBadges(userId),
		fetchBooks(userId),
		fetchRecentSessions(5, userId)
	]);

	return {
		stats,
		challenge,
		badges,
		books,
		recentSessions
	};
};
