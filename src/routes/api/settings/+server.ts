import { json } from '@sveltejs/kit';
import { LANG_COOKIE } from '$lib/i18n';
import { completeUserOnboarding } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, locals, url }) => {
	if (!locals.user) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();

		if (body.lang === 'id' || body.lang === 'en') {
			cookies.set(LANG_COOKIE, body.lang, {
				path: '/',
				httpOnly: false,
				sameSite: 'lax',
				secure: url.protocol === 'https:',
				maxAge: 60 * 60 * 24 * 365
			});
		}

		const hasProfilePayload =
			body.userName !== undefined ||
			body.timezone !== undefined ||
			body.maxConcurrentBooks !== undefined ||
			body.targetBooks !== undefined ||
			body.targetPages !== undefined;

		if (hasProfilePayload) {
			const userName = String(body.userName ?? locals.user.userName).trim();
			const timezone = String(body.timezone ?? locals.user.timezone).trim() || 'Asia/Jakarta';
			const maxConcurrentBooks = Number(
				body.maxConcurrentBooks ?? locals.user.maxConcurrentBooks
			);
			const targetBooks = Number(body.targetBooks ?? 12);
			const targetPages = Number(body.targetPages ?? 3600);

			if (userName.length < 2 || userName.length > 100) {
				return json(
					{ ok: false, error: 'Nama tampilan harus antara 2–100 karakter.' },
					{ status: 400 }
				);
			}
			if (!Number.isFinite(targetBooks) || targetBooks < 1) {
				return json({ ok: false, error: 'Target buku tahunan minimal 1.' }, { status: 400 });
			}
			if (!Number.isFinite(targetPages) || targetPages < 100) {
				return json(
					{ ok: false, error: 'Target halaman tahunan minimal 100.' },
					{ status: 400 }
				);
			}

			await completeUserOnboarding({
				userId: locals.user.userId,
				userName,
				timezone,
				maxConcurrentBooks,
				targetBooks,
				targetPages
			});
		}

		return json({ ok: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.';
		return json({ ok: false, error: message }, { status: 400 });
	}
};
