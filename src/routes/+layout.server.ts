import { fetchBooks, fetchRecentSessions, fetchWeeklyPlan } from '$lib/server/repository';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const [weeklyPlan, recentSessions, books] = await Promise.all([
		fetchWeeklyPlan(),
		fetchRecentSessions(5),
		fetchBooks()
	]);
	return {
		weeklyPlan,
		recentSessions,
		books
	};
};
