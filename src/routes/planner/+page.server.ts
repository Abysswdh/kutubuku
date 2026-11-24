import {
	fetchScheduleDays,
	fetchUserStats,
	fetchWeekDays,
	fetchWeeklyPlan
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const userId = locals.user?.userId;
	const [layoutData, weekDays, weeklyPlan, scheduleDays] = await Promise.all([
		parent(),
		fetchWeekDays(),
		fetchWeeklyPlan(),
		fetchScheduleDays()
	]);

	return {
		weekDays,
		weeklyPlan,
		scheduleDays,
		stats: layoutData.stats ?? (await fetchUserStats(userId)),
		books: layoutData.books
	};
};
