import {
	fetchBadges,
	fetchCurrentlyReading,
	fetchDailyGoal,
	fetchUserStats,
	fetchWeekDays
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [stats, dailyGoal, currentlyReading, weekDays, badges] = await Promise.all([
		fetchUserStats(),
		fetchDailyGoal(),
		fetchCurrentlyReading(),
		fetchWeekDays(),
		fetchBadges()
	]);

	return {
		stats,
		dailyGoal,
		currentlyReading,
		weekDays,
		badges
	};
};
