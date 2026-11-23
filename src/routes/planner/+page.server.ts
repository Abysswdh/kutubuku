import {
	fetchBooks,
	fetchScheduleDays,
	fetchUserStats,
	fetchWeekDays,
	fetchWeeklyPlan
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [weekDays, weeklyPlan, scheduleDays, stats, books] = await Promise.all([
		fetchWeekDays(),
		fetchWeeklyPlan(),
		fetchScheduleDays(),
		fetchUserStats(),
		fetchBooks()
	]);

	return {
		weekDays,
		weeklyPlan,
		scheduleDays,
		stats,
		books
	};
};
