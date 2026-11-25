import {
	fetchBooks,
	fetchDailyGoal,
	fetchRecentSessions,
	fetchUserStats,
	fetchWeeklyPlan
} from '$lib/server/repository';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {
			user: null,
			stats: null,
			dailyGoal: null,
			weeklyPlan: null,
			recentSessions: [],
			books: []
		};
	}

	const userId = locals.user.userId;
	const [stats, dailyGoal, weeklyPlan, recentSessions, books] = await Promise.all([
		fetchUserStats(userId),
		fetchDailyGoal(userId),
		fetchWeeklyPlan(userId),
		fetchRecentSessions(5, userId),
		fetchBooks(userId)
	]);

	return {
		user: locals.user,
		stats,
		dailyGoal,
		weeklyPlan,
		recentSessions,
		books
	};
};
