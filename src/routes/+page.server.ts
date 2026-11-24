import {
	fetchBadges,
	fetchDailyGoal,
	fetchUserStats,
	fetchWeekDays
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const userId = locals.user?.userId;
	const [layoutData, weekDays, badges] = await Promise.all([
		parent(),
		fetchWeekDays(),
		fetchBadges(userId)
	]);

	const books = layoutData.books;
	const currentlyReading = books.find((b) => b.status === 'reading');
	const stats = layoutData.stats ?? (await fetchUserStats(userId));
	const dailyGoal = layoutData.dailyGoal ?? (await fetchDailyGoal(userId));

	return {
		stats,
		dailyGoal,
		currentlyReading,
		weekDays,
		badges,
		books
	};
};
