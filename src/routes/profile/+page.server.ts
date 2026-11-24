import {
	fetchBadges,
	fetchReadingChallenge,
	fetchUserStats
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const userId = locals.user?.userId;
	const [layoutData, challenge, badges] = await Promise.all([
		parent(),
		fetchReadingChallenge(userId),
		fetchBadges(userId)
	]);

	return {
		stats: layoutData.stats ?? (await fetchUserStats(userId)),
		challenge,
		badges,
		books: layoutData.books,
		recentSessions: layoutData.recentSessions
	};
};
