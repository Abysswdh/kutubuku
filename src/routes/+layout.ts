import { getDailyGoal, getUserStats } from '$lib/data/mock';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	// Loaded from mock data now; will be replaced by PostgreSQL query later
	return {
		stats: getUserStats(),
		dailyGoal: getDailyGoal()
	};
};
