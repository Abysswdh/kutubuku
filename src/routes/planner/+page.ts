import { getBooks, getWeekDays, getWeeklyPlan } from '$lib/data/mock';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		weekDays: getWeekDays(),
		weeklyPlan: getWeeklyPlan(),
		books: getBooks()
	};
};

