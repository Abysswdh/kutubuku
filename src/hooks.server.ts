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
	const isOnboardingRoute = path === '/onboarding';
	const isApiRoute = path.startsWith('/api/');

	if (!event.locals.user) {
		if (isApiRoute) {
			return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}
		if (!isAuthRoute) {
			redirect(303, '/auth');
		}
	} else {
		if (!event.locals.user.onboarded && !isOnboardingRoute && !isAuthRoute && !isApiRoute) {
			redirect(303, '/onboarding');
		}
		if (event.locals.user.onboarded && (path === '/auth' || path === '/onboarding')) {
			redirect(303, '/');
		}
	}

	return resolve(event);
};
