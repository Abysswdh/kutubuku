import { error } from '@sveltejs/kit';
import { fetchPublicProfile } from '$lib/server/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const profile = await fetchPublicProfile(params.userId);
	if (!profile) {
		error(404, { message: 'Reader profile not found.' });
	}
	return {
		profile,
		isLoggedIn: Boolean(locals.user)
	};
};
