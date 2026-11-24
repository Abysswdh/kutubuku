import {
	fetchSobatDirectory,
	fetchSobatFeed,
	fetchSobatLeaderboard
} from '$lib/server/sobat';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.userId ?? 'US00000001';
	const [feed, leaderboard, directory] = await Promise.all([
		fetchSobatFeed(userId),
		fetchSobatLeaderboard(userId),
		fetchSobatDirectory(userId)
	]);

	return {
		feed,
		leaderboard,
		directory
	};
};
