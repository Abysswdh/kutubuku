<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { t, type Lang } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let lang = $derived<Lang>(data.lang === 'en' ? 'en' : 'id');

	let userName = $state('');
	let timezone = $state('Asia/Jakarta');
	let maxConcurrentBooks = $state(3);
	let targetBooks = $state(12);
	let targetPages = $state(3600);
	let initialized = $state(false);

	let geminiKey = $state(
		typeof window !== 'undefined' ? (localStorage.getItem('kutubuku_gemini_key') ?? '') : ''
	);
	let savingProfile = $state(false);
	let savingLang = $state(false);
	let feedback = $state<string | null>(null);
	let errorMsg = $state<string | null>(null);

	$effect(() => {
		if (!initialized) {
			userName = data.user.userName;
			timezone = data.user.timezone || 'Asia/Jakarta';
			maxConcurrentBooks = data.user.maxConcurrentBooks || 3;
			targetBooks = data.challenge.targetBooks || 12;
			targetPages = data.challenge.targetPages || 3600;
			initialized = true;
		}
	});

	async function switchLanguage(nextLang: Lang) {
		if (savingLang || lang === nextLang) return;
		savingLang = true;
		feedback = null;
		errorMsg = null;
		try {
			const res = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lang: nextLang })
			});
			const json = await res.json();
			if (!json.ok) {
				errorMsg = json.error ?? 'Gagal mengganti bahasa.';
				return;
			}
			await invalidateAll();
			feedback = nextLang === 'en' ? 'Language switched to English.' : 'Bahasa diubah ke Indonesia.';
		} finally {
			savingLang = false;
		}
	}

	function detectTimezone() {
		try {
			const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
			if (detected) timezone = detected;
		} catch {
			// keep current value
		}
	}

	async function handleSaveSettings(e: SubmitEvent) {
		e.preventDefault();
		savingProfile = true;
		feedback = null;
		errorMsg = null;
		try {
			const res = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userName: userName.trim(),
					timezone: timezone.trim(),
					maxConcurrentBooks: Number(maxConcurrentBooks),
					targetBooks: Number(targetBooks),
					targetPages: Number(targetPages)
				})
			});
			const json = await res.json();
			if (!json.ok) {
				errorMsg = json.error ?? t(lang, 'Gagal menyimpan pengaturan.', 'Failed to save settings.');
				return;
			}
			await invalidateAll();
			feedback = t(lang, 'Pengaturan berhasil disimpan.', 'Settings saved.');
		} finally {
			savingProfile = false;
		}
	}

	function saveGeminiKey() {
		if (typeof window === 'undefined') return;
		if (geminiKey.trim()) {
			localStorage.setItem('kutubuku_gemini_key', geminiKey.trim());
			feedback = t(lang, 'Kunci API Gemini disimpan di browser.', 'Gemini API key saved in browser.');
		} else {
			localStorage.removeItem('kutubuku_gemini_key');
			feedback = t(lang, 'Kunci API Gemini dihapus.', 'Gemini API key removed.');
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-xl font-extrabold tracking-tight text-zinc-900">
			{t(lang, 'Pengaturan', 'Settings')}
		</h1>
		<p class="text-xs font-semibold text-zinc-400">
			{t(lang, 'Atur bahasa, target baca, dan preferensi akunmu.', 'Manage language, reading targets, and account preferences.')}
		</p>
	</div>

	{#if feedback}
		<div class="rounded-2xl border border-accent/30 bg-accent-subtle px-4 py-3 text-xs font-bold text-accent-text">
			✓ {feedback}
		</div>
	{/if}
	{#if errorMsg}
		<div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
			⚠️ {errorMsg}
		</div>
	{/if}

	<!-- Language Switcher -->
	<section class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-3">
		<div>
			<h2 class="text-sm font-extrabold text-zinc-900">{t(lang, 'Bahasa Aplikasi', 'App Language')}</h2>
			<p class="text-xs font-medium text-zinc-400">
				{t(lang, 'Pilih bahasa tampilan untuk seluruh halaman Kutubuku.', 'Choose display language across Kutubuku.')}
			</p>
		</div>

		<div class="grid grid-cols-2 gap-2">
			<button
				type="button"
				disabled={savingLang}
				onclick={() => switchLanguage('id')}
				class="rounded-xl border-2 py-2.5 text-xs font-extrabold transition {lang === 'id'
					? 'border-accent bg-accent-subtle text-accent-text'
					: 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}"
			>
				🇮🇩 Bahasa Indonesia
			</button>
			<button
				type="button"
				disabled={savingLang}
				onclick={() => switchLanguage('en')}
				class="rounded-xl border-2 py-2.5 text-xs font-extrabold transition {lang === 'en'
					? 'border-accent bg-accent-subtle text-accent-text'
					: 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}"
			>
				🇬🇧 English
			</button>
		</div>
	</section>

	<!-- Profile & Reading Goals Form -->
	<form
		onsubmit={handleSaveSettings}
		class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-4"
	>
		<h2 class="text-sm font-extrabold text-zinc-900">
			{t(lang, 'Profil & Target Baca', 'Profile & Reading Goals')}
		</h2>

		<label class="block space-y-1">
			<span class="text-xs font-extrabold text-zinc-700">{t(lang, 'Nama Tampilan', 'Display Name')}</span>
			<input
				type="text"
				required
				minlength="2"
				maxlength="100"
				bind:value={userName}
				class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
			/>
		</label>

		<div class="space-y-1.5">
			<span class="block text-xs font-extrabold text-zinc-700">
				{t(lang, 'Batas Buku Dibaca Bersamaan', 'Max Concurrent Books')}
			</span>
			<div class="grid grid-cols-4 gap-2">
				{#each [1, 2, 3, 5] as count}
					<button
						type="button"
						onclick={() => (maxConcurrentBooks = count)}
						class="rounded-xl border-2 py-2 text-xs font-extrabold transition {maxConcurrentBooks === count
							? 'border-accent bg-accent-subtle text-accent-text'
							: 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}"
					>
						{count}
					</button>
				{/each}
			</div>
		</div>

		<div class="space-y-1">
			<div class="flex items-center justify-between">
				<label for="settings-tz" class="text-xs font-extrabold text-zinc-700">
					{t(lang, 'Zona Waktu', 'Timezone')}
				</label>
				<button
					type="button"
					onclick={detectTimezone}
					class="text-[11px] font-extrabold text-accent hover:underline"
				>
					{t(lang, 'Deteksi otomatis', 'Auto-detect')}
				</button>
			</div>
			<input
				id="settings-tz"
				type="text"
				bind:value={timezone}
				class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
			/>
		</div>

		<div class="grid grid-cols-2 gap-3 pt-1">
			<label class="block space-y-1">
				<span class="text-xs font-extrabold text-zinc-700">
					{t(lang, `Target Buku ${data.currentYear}`, `${data.currentYear} Book Target`)}
				</span>
				<input
					type="number"
					min="1"
					max="365"
					required
					bind:value={targetBooks}
					class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
				/>
			</label>
			<label class="block space-y-1">
				<span class="text-xs font-extrabold text-zinc-700">
					{t(lang, `Target Halaman ${data.currentYear}`, `${data.currentYear} Page Target`)}
				</span>
				<input
					type="number"
					min="100"
					step="100"
					required
					bind:value={targetPages}
					class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
				/>
			</label>
		</div>

		<button
			type="submit"
			disabled={savingProfile}
			class="w-full rounded-xl bg-accent py-2.5 text-xs font-extrabold tracking-wider text-white uppercase transition hover:bg-accent-hover disabled:opacity-50"
		>
			{savingProfile
				? t(lang, 'Menyimpan...', 'Saving...')
				: t(lang, 'Simpan Perubahan', 'Save Changes')}
		</button>
	</form>

	<!-- BYOK Gemini Key -->
	<section class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-3">
		<div>
			<h2 class="text-sm font-extrabold text-zinc-900">
				{t(lang, 'Kunci API Google Gemini (Opsional)', 'Google Gemini API Key (Optional)')}
			</h2>
			<p class="text-xs font-medium text-zinc-400">
				{t(lang, 'Disimpan di browser untuk fitur jadwal baca AI di halaman Jadwal.', 'Stored locally in your browser for AI schedule rationales.')}
			</p>
		</div>
		<div class="flex gap-2">
			<input
				type="password"
				bind:value={geminiKey}
				placeholder="AIzaSy..."
				class="flex-1 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none"
			/>
			<button
				type="button"
				onclick={saveGeminiKey}
				class="shrink-0 rounded-xl border-2 border-zinc-200 bg-white px-3.5 py-2 text-xs font-extrabold text-zinc-700 hover:border-accent hover:text-accent"
			>
				{t(lang, 'Simpan', 'Save')}
			</button>
		</div>
	</section>

	<!-- Account Actions -->
	<section class="rounded-2xl border-2 border-zinc-200 bg-white p-5 flex items-center justify-between gap-3">
		<div class="min-w-0">
			<div class="text-xs font-extrabold text-zinc-900 truncate">{data.user.userEmail}</div>
			<a href="/u/{data.user.userId}" class="text-xs font-bold text-accent hover:underline">
				{t(lang, 'Lihat Kartu Profil Publik →', 'View Public Profile Card →')}
			</a>
		</div>
		<form method="POST" action="/auth/logout">
			<button
				type="submit"
				class="rounded-xl border-2 border-red-200 bg-red-50 px-3.5 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-100"
			>
				{t(lang, 'Keluar', 'Sign Out')}
			</button>
		</form>
	</section>
</div>
