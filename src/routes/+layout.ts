import { getBooks, getRecentSessions, getWeeklyPlan } from '$lib/data/mock';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	// Root data for global navigation and desktop companion panel
	return {
		weeklyPlan: getWeeklyPlan(),
		recentSessions: getRecentSessions(5),
		books: getBooks()
	};
};
