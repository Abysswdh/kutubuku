import {
	fetchBadges,
	fetchBooks,
	fetchCurrentlyReading,
	fetchDailyGoal,
	fetchUserStats,
	fetchWeekDays
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.userId;
	const [stats, dailyGoal, currentlyReading, weekDays, badges, books] = await Promise.all([
		fetchUserStats(userId),
		fetchDailyGoal(userId),
		fetchCurrentlyReading(userId),
		fetchWeekDays(),
		fetchBadges(userId),
		fetchBooks(userId)
	]);

	return {
		stats,
		dailyGoal,
		currentlyReading,
		weekDays,
		badges,
		books
	};
};
