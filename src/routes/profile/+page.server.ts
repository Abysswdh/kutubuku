import {
	fetchBadges,
	fetchBooks,
	fetchReadingChallenge,
	fetchRecentSessions,
	fetchUserStats
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [stats, challenge, badges, books, recentSessions] = await Promise.all([
		fetchUserStats(),
		fetchReadingChallenge(),
		fetchBadges(),
		fetchBooks(),
		fetchRecentSessions(5)
	]);

	return {
		stats,
		challenge,
		badges,
		books,
		recentSessions
	};
};
