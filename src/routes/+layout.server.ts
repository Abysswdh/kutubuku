import {
	fetchBooks,
	fetchDailyGoal,
	fetchRecentSessions,
	fetchUserStats,
	fetchWeeklyPlan
} from '$lib/server/repository';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const [stats, dailyGoal, weeklyPlan, recentSessions, books] = await Promise.all([
		fetchUserStats(),
		fetchDailyGoal(),
		fetchWeeklyPlan(),
		fetchRecentSessions(5),
		fetchBooks()
	]);
	return {
		stats,
		dailyGoal,
		weeklyPlan,
		recentSessions,
		books
	};
};
