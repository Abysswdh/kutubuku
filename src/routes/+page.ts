import {
	getBooks,
	getCurrentlyReading,
	getDailyGoal,
	getUserStats
} from '$lib/data/mock';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		stats: getUserStats(),
		dailyGoal: getDailyGoal(),
		currentlyReading: getCurrentlyReading(),
		books: getBooks()
	};
};
