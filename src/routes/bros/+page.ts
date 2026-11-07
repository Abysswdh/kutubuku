import { getBroUpdates } from '$lib/data/mock';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		updates: getBroUpdates()
	};
};

