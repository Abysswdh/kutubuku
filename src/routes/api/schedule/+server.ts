import { json } from '@sveltejs/kit';
import { createReadingSchedule } from '$lib/server/repository';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { bookId, targetPagesPerDay, geminiApiKey, bookTitle, remainingPages } = body;

		let aiRationale: string | undefined;

		// Optional Bring-Your-Own-Key (BYOK) Google Gemini API call
		if (geminiApiKey && typeof geminiApiKey === 'string' && geminiApiKey.trim().length > 10) {
			try {
				const prompt = `You are Kutubuku, an encouraging reading habit coach. A reader is scheduling "${bookTitle || 'their current book'}" with ${remainingPages || 150} pages remaining at a target pace of ${targetPagesPerDay} pages per day. Write a concise, motivating 1-2 sentence weekly reading schedule rationale explaining how this daily pace helps prevent book hoarding (tsundoku) and finish on time.`;
				const resp = await fetch(
					`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiApiKey.trim())}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							contents: [{ parts: [{ text: prompt }] }]
						})
					}
				);
				if (resp.ok) {
					const data = await resp.json();
					const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
					if (text) {
						aiRationale = `✨ Gemini AI Plan: ${text.trim()}`;
					}
				}
			} catch {
				// Graceful fallback to deterministic math rationale if offline or invalid key
			}
		}

		const schedule = await createReadingSchedule({
			bookId,
			targetPagesPerDay: Number(targetPagesPerDay),
			rationale: aiRationale
		});

		return json({ ok: true, ...schedule, usedAi: Boolean(aiRationale) });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to generate schedule';
		return json({ ok: false, error: message }, { status: 400 });
	}
};
