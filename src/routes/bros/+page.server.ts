import { fetchBroUpdates } from '$lib/server/repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		updates: await fetchBroUpdates()
	};
};
