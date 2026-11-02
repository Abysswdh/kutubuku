import {
	getBooks,
	getDailyGoal,
	getRecentSessions,
	getUserStats,
	getWeeklyPlan
} from '$lib/data/mock';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	return {
		stats: getUserStats(),
		dailyGoal: getDailyGoal(),
		weeklyPlan: getWeeklyPlan(),
		recentSessions: getRecentSessions(5),
		books: getBooks()
	};
};
