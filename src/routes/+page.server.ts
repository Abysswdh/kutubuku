import {
	fetchBadges,
	fetchBooks,
	fetchCurrentlyReading,
	fetchDailyGoal,
	fetchUserStats,
	fetchWeekDays
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [stats, dailyGoal, currentlyReading, weekDays, badges, books] = await Promise.all([
		fetchUserStats(),
		fetchDailyGoal(),
		fetchCurrentlyReading(),
		fetchWeekDays(),
		fetchBadges(),
		fetchBooks()
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
