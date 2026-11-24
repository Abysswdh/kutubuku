import {
	fetchBookmateDirectory,
	fetchBookmateFeed,
	fetchBookmateLeaderboard
} from '$lib/server/bookmates';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.userId ?? 'US00000001';
	const [feed, leaderboard, directory] = await Promise.all([
		fetchBookmateFeed(userId),
		fetchBookmateLeaderboard(userId),
		fetchBookmateDirectory(userId)
	]);

	return {
		feed,
		leaderboard,
		directory
	};
};
