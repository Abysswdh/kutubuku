import { fail, redirect } from '@sveltejs/kit';
import {
	authenticateManualUser,
	createSessionCookie,
	isGoogleAuthConfigured,
	registerManualUser
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	return {
		googleEnabled: isGoogleAuthConfigured(),
		oauthError: url.searchParams.get('error')
	};
};

export const actions: Actions = {
	register: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const userName = String(data.get('userName') ?? '').trim();
		const userEmail = String(data.get('userEmail') ?? '').trim();
		const password = String(data.get('password') ?? '');

		if (userName.length < 2 || userName.length > 100) {
			return fail(400, {
				mode: 'register' as const,
				userName,
				userEmail,
				error: 'Username must be between 2 and 100 characters.'
			});
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
			return fail(400, {
				mode: 'register' as const,
				userName,
				userEmail,
				error: 'Please enter a valid email address.'
			});
		}
		if (password.length < 6) {
			return fail(400, {
				mode: 'register' as const,
				userName,
				userEmail,
				error: 'Password must be at least 6 characters.'
			});
		}

		const result = await registerManualUser({ userName, userEmail, password });
		if (result.error || !result.user) {
			return fail(400, {
				mode: 'register' as const,
				userName,
				userEmail,
				error: result.error ?? 'Could not create account.'
			});
		}

		createSessionCookie(cookies, result.user.userId, url.protocol === 'https:');
		redirect(303, '/onboarding');
	},

	login: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const userEmail = String(data.get('userEmail') ?? '').trim();
		const password = String(data.get('password') ?? '');

		if (!userEmail || !password) {
			return fail(400, {
				mode: 'login' as const,
				userEmail,
				error: 'Please enter your email and password.'
			});
		}

		const result = await authenticateManualUser(userEmail, password);
		if (result.error || !result.user) {
			return fail(400, {
				mode: 'login' as const,
				userEmail,
				error: result.error ?? 'Invalid email or password.'
			});
		}

		createSessionCookie(cookies, result.user.userId, url.protocol === 'https:');
		redirect(303, result.user.onboarded ? '/' : '/onboarding');
	}
};
