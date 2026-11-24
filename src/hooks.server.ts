import { json, redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { clearSessionCookie, findUserById, readSessionUserId } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const userId = readSessionUserId(event.cookies);

	if (userId) {
		try {
			const user = await findUserById(userId);
			if (user) {
				event.locals.user = user;
			} else {
				clearSessionCookie(event.cookies);
				event.locals.user = null;
			}
		} catch (err) {
			console.error('[kutubuku/auth] Failed to resolve session user:', err);
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	const path = event.url.pathname;
	const isAuthRoute = path === '/auth' || path.startsWith('/auth/');
	const isPublicGuestRoute =
		path === '/' ||
		path === '/catalog' ||
		path.startsWith('/u/') ||
		isAuthRoute;
	const isOnboardingRoute = path === '/onboarding';
	const isAdminRoute = path === '/admin' || path.startsWith('/admin/');
	const isAdminApiRoute = path.startsWith('/api/admin/');
	const isApiRoute = path.startsWith('/api/');

	if (!event.locals.user) {
		if (isApiRoute) {
			return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}
		if (!isPublicGuestRoute) {
			redirect(303, '/auth');
		}
	} else {
		if (isAdminApiRoute && event.locals.user.role !== 'admin') {
			return json({ ok: false, error: 'Forbidden: Admin access required' }, { status: 403 });
		}
		if (isAdminRoute && event.locals.user.role !== 'admin') {
			redirect(303, '/');
		}
		if (
			!event.locals.user.onboarded &&
			!isOnboardingRoute &&
			!isAuthRoute &&
			!isApiRoute &&
			!path.startsWith('/u/')
		) {
			redirect(303, '/onboarding');
		}
		if (event.locals.user.onboarded && (path === '/auth' || path === '/onboarding')) {
			redirect(303, '/');
		}
	}

	return resolve(event);
};
