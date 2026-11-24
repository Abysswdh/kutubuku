import {
	fetchBooks,
	fetchScheduleDays,
	fetchUserStats,
	fetchWeekDays,
	fetchWeeklyPlan
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.userId;
	const [weekDays, weeklyPlan, scheduleDays, stats, books] = await Promise.all([
		fetchWeekDays(),
		fetchWeeklyPlan(),
		fetchScheduleDays(),
		fetchUserStats(userId),
		fetchBooks(userId)
	]);

	return {
		weekDays,
		weeklyPlan,
		scheduleDays,
		stats,
		books
	};
};
