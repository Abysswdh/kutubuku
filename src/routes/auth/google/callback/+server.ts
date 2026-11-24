import { redirect } from '@sveltejs/kit';
import { decodeIdToken } from 'arctic';
import { createSessionCookie, findOrCreateGoogleUser, getGoogleClient } from '$lib/server/auth';
import type { RequestHandler } from './$types';

interface GoogleIdClaims {
	sub?: string;
	email?: string;
	name?: string;
}

export const GET: RequestHandler = async ({ cookies, url }) => {
	const google = getGoogleClient(url.origin);
	if (!google) {
		redirect(303, '/auth?error=google_not_configured');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state');
	const codeVerifier = cookies.get('google_code_verifier');

	cookies.delete('google_oauth_state', { path: '/' });
	cookies.delete('google_code_verifier', { path: '/' });

	if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
		redirect(303, '/auth?error=google_failed');
	}

	let claims: GoogleIdClaims;
	try {
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		claims = decodeIdToken(tokens.idToken()) as GoogleIdClaims;
	} catch {
		redirect(303, '/auth?error=google_failed');
	}

	if (!claims.sub || !claims.email) {
		redirect(303, '/auth?error=google_failed');
	}

	let user;
	try {
		({ user } = await findOrCreateGoogleUser({
			googleSub: claims.sub,
			email: claims.email,
			name: claims.name ?? ''
		}));
	} catch (err) {
		console.error('[kutubuku/auth] Google user upsert failed:', err);
		redirect(303, '/auth?error=google_failed');
	}

	createSessionCookie(cookies, user.userId, url.protocol === 'https:');
	redirect(303, user.onboarded ? '/' : '/onboarding');
};
