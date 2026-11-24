import { redirect } from '@sveltejs/kit';
import { generateCodeVerifier, generateState } from 'arctic';
import { getGoogleClient } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const google = getGoogleClient(url.origin);
	if (!google) {
		redirect(303, '/auth?error=google_not_configured');
	}

	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const authUrl = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

	const secure = url.protocol === 'https:';
	cookies.set('google_oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: 60 * 10
	});
	cookies.set('google_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: 60 * 10
	});

	redirect(302, authUrl.toString(), { external: ['https://accounts.google.com'] });
};
