import {
	getBadges,
	getCurrentlyReading,
	getDailyGoal,
	getUserStats,
	getWeekDays
} from '$lib/data/mock';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		stats: getUserStats(),
		dailyGoal: getDailyGoal(),
		currentlyReading: getCurrentlyReading(),
		weekDays: getWeekDays(),
		badges: getBadges()
	};
};
