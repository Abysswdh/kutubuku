import {
	getCurrentlyReading,
	getDailyGoal,
	getRecentSessions,
	getUserStats,
	getWeekDays
} from '$lib/data/mock';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Loaded from mock data; when connecting PostgreSQL, this load function will query DB
	const stats = getUserStats();
	const dailyGoal = getDailyGoal();
	const currentlyReading = getCurrentlyReading();
	const weekDays = getWeekDays();
	const recentSessions = getRecentSessions(3);

	return {
		stats,
		dailyGoal,
		currentlyReading,
		weekDays,
		recentSessions
	};
};
