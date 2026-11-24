import { fetchVerifiedCatalog } from '$lib/server/catalog';
import {
	fetchBadges,
	fetchDailyGoal,
	fetchUserStats,
	fetchWeekDays
} from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) {
		const featuredBooks = await fetchVerifiedCatalog(undefined, 6);
		return {
			isGuest: true as const,
			featuredBooks,
			stats: null,
			dailyGoal: null,
			currentlyReading: undefined,
			weekDays: [],
			badges: [],
			books: []
		};
	}

	const userId = locals.user.userId;
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
		isGuest: false as const,
		featuredBooks: [],
		stats,
		dailyGoal,
		currentlyReading,
		weekDays,
		badges,
		books
	};
};
