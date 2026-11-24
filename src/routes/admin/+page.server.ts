import { redirect } from '@sveltejs/kit';
import { fetchAdminDashboard } from '$lib/server/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		redirect(303, '/');
	}
	return await fetchAdminDashboard();
};
