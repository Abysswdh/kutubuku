import { getBadges, getBooks, getRecentSessions, getUserStats } from '$lib/data/mock';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		stats: getUserStats(),
		badges: getBadges(),
		books: getBooks(),
		recentSessions: getRecentSessions(5)
	};
};

