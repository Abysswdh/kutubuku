import { fetchVerifiedCatalog } from '$lib/server/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const books = await fetchVerifiedCatalog(locals.user?.userId, 100);
	return {
		books,
		isLoggedIn: Boolean(locals.user)
	};
};
