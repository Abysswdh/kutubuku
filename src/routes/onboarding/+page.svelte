<script lang="ts">
	import { page } from '$app/state';
	import { t, type Lang } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let lang = $derived<Lang>(page.data.lang === 'en' ? 'en' : 'id');
	let step = $state<1 | 2>(1);
	let submitting = $state(false);

	let userName = $state('');
	let timezone = $state('Asia/Jakarta');
	let maxConcurrentBooks = $state(3);
	let targetBooks = $state(12);
	let targetPages = $state(3600);

	let firstBookTitle = $state('');
	let firstBookAuthor = $state('');
	let firstBookPages = $state('');

	$effect(() => {
		if (!userName && data.user.userName) {
			userName = data.user.userName;
		}
		try {
			const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
			if (detected) timezone = detected;
		} catch {
			// keep default Asia/Jakarta
		}
	});

	let goalPresets = $derived([
		{ label: t(lang, 'Santai', 'Casual'), books: 6, pages: 1800 },
		{ label: t(lang, 'Stabil', 'Steady'), books: 12, pages: 3600 },
		{ label: t(lang, 'Kutu Buku', 'Bookworm'), books: 24, pages: 7200 }
	]);

	function pickPreset(books: number, pages: number) {
		targetBooks = books;
		targetPages = pages;
	}
</script>

<div class="space-y-6">
	<!-- Progress Header -->
	<div class="space-y-2.5">
		<div class="flex items-center justify-between text-xs font-extrabold text-zinc-400">
			<img src="/brand/logo-full-teal.svg" alt="Kutubuku" class="h-6 w-auto" />
			<span>{t(lang, `Langkah ${step} dari 2`, `Step ${step} of 2`)}</span>
		</div>
		<div class="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200">
			<div
				class="h-full rounded-full bg-accent transition-all duration-300"
				style="width: {step === 1 ? '50%' : '100%'}"
			></div>
		</div>
	</div>

	<form
		method="POST"
		action="?/complete"
		onsubmit={() => (submitting = true)}
		class="rounded-2xl border-2 border-zinc-200 bg-white p-6 space-y-5"
	>
		<!-- Always submit step 1 values even while viewing step 2 -->
		<input type="hidden" name="userName" value={userName} />
		<input type="hidden" name="timezone" value={timezone} />
		<input type="hidden" name="maxConcurrentBooks" value={maxConcurrentBooks} />

		{#if form?.error}
			<div class="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700">
				{form.error}
			</div>
		{/if}

		{#if step === 1}
			<div class="space-y-1">
				<h1 class="text-xl font-black tracking-tight text-zinc-900">
					{t(lang, 'Selamat datang di Kutubuku! 👋', 'Welcome to Kutubuku! 👋')}
				</h1>
				<p class="text-xs font-semibold text-zinc-500">
					{t(lang, 'Sesuaikan rak bacamu agar membaca terasa lebih ringan dan konsisten.', 'Let’s personalize your reading shelf so you finish more books without overwhelm.')}
				</p>
			</div>

			<label class="block space-y-1">
				<span class="text-xs font-extrabold text-zinc-700">
					{t(lang, 'Nama panggilanmu?', 'What should we call you?')}
				</span>
				<input
					type="text"
					bind:value={userName}
					required
					minlength="2"
					maxlength="100"
					placeholder={t(lang, 'Nama tampilanmu', 'Your display name')}
					class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
				/>
			</label>

			<div class="space-y-2">
				<span class="block text-xs font-extrabold text-zinc-700">
					{t(lang, 'Maksimal buku yang dibaca bersamaan', 'Max books you read at the same time')}
				</span>
				<div class="grid grid-cols-4 gap-2">
					{#each [1, 2, 3, 5] as count}
						<button
							type="button"
							onclick={() => (maxConcurrentBooks = count)}
							class="rounded-xl border-2 py-2.5 text-sm font-extrabold transition {maxConcurrentBooks === count
								? 'border-accent bg-accent-subtle text-accent-text'
								: 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}"
						>
							{count}
						</button>
					{/each}
				</div>
				<p class="text-[11px] font-semibold text-zinc-400">
					{t(lang, 'Membantu mencegah tumpukan buku tak terbaca (tsundoku) dan menjaga fokus.', 'Helps prevent book hoarding (tsundoku) and keeps your focus sharp.')}
				</p>
			</div>

			<div class="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-semibold text-zinc-500 flex items-center justify-between">
				<span>{t(lang, 'Zona waktu terdeteksi', 'Detected timezone')}</span>
				<span class="font-extrabold text-zinc-800">{timezone}</span>
			</div>

			<button
				type="button"
				disabled={userName.trim().length < 2}
				onclick={() => (step = 2)}
				class="w-full rounded-xl bg-accent px-4 py-3 text-sm font-extrabold text-white transition hover:bg-accent-hover disabled:opacity-50"
			>
				{t(lang, 'Lanjut →', 'Continue →')}
			</button>
		{:else}
			<div class="space-y-1">
				<h1 class="text-xl font-black tracking-tight text-zinc-900">
					{t(lang, `Tentukan target baca ${data.currentYear} 🏆`, `Set your ${data.currentYear} reading goal 🏆`)}
				</h1>
				<p class="text-xs font-semibold text-zinc-500">
					{t(lang, 'Pilih ritme yang realistis — kamu bisa mengubahnya kapan saja nanti.', 'Pick a pace that feels realistic—you can always adjust it later.')}
				</p>
			</div>

			<!-- Goal Presets -->
			<div class="grid grid-cols-3 gap-2">
				{#each goalPresets as preset}
					<button
						type="button"
						onclick={() => pickPreset(preset.books, preset.pages)}
						class="rounded-xl border-2 p-2.5 text-left transition {targetBooks === preset.books
							? 'border-accent bg-accent-subtle text-accent-text'
							: 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'}"
					>
						<div class="text-xs font-black">{preset.label}</div>
						<div class="text-[11px] font-bold opacity-80">
							{preset.books} {t(lang, 'buku', 'books')}
						</div>
					</button>
				{/each}
			</div>

			<div class="grid grid-cols-2 gap-3">
				<label class="block space-y-1">
					<span class="text-xs font-extrabold text-zinc-700">
						{t(lang, 'Buku / tahun', 'Books / year')}
					</span>
					<input
						type="number"
						name="targetBooks"
						min="1"
						max="365"
						bind:value={targetBooks}
						required
						class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
					/>
				</label>
				<label class="block space-y-1">
					<span class="text-xs font-extrabold text-zinc-700">
						{t(lang, 'Halaman / tahun', 'Pages / year')}
					</span>
					<input
						type="number"
						name="targetPages"
						min="100"
						step="100"
						bind:value={targetPages}
						required
						class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
					/>
				</label>
			</div>

			<!-- Optional First Book -->
			<div class="space-y-2.5 border-t border-zinc-200 pt-4">
				<div class="flex items-center justify-between">
					<span class="text-xs font-extrabold text-zinc-700">
						{t(lang, 'Lagi baca buku apa sekarang?', 'Currently reading a book?')}
					</span>
					<span class="text-[11px] font-bold text-zinc-400">
						{t(lang, 'Opsional', 'Optional')}
					</span>
				</div>
				<input
					type="text"
					name="firstBookTitle"
					bind:value={firstBookTitle}
					placeholder={t(lang, 'Judul buku (mis. Filosofi Teras)', 'Book title (e.g. Atomic Habits)')}
					class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
				/>
				{#if firstBookTitle.trim().length > 0}
					<div class="grid grid-cols-2 gap-2">
						<input
							type="text"
							name="firstBookAuthor"
							bind:value={firstBookAuthor}
							placeholder={t(lang, 'Penulis', 'Author')}
							class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
						/>
						<input
							type="number"
							name="firstBookPages"
							min="1"
							bind:value={firstBookPages}
							placeholder={t(lang, 'Total halaman', 'Total pages')}
							class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
						/>
					</div>
				{/if}
			</div>

			<div class="flex gap-2.5">
				<button
					type="button"
					onclick={() => (step = 1)}
					class="rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm font-extrabold text-zinc-600 hover:bg-zinc-50"
				>
					← {t(lang, 'Kembali', 'Back')}
				</button>
				<button
					type="submit"
					disabled={submitting}
					class="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-extrabold text-white transition hover:bg-accent-hover disabled:opacity-60"
				>
					{submitting
						? t(lang, 'Menyiapkan rak...', 'Setting up shelf...')
						: t(lang, 'Selesai & Mulai 🚀', 'Finish Setup 🚀')}
				</button>
			</div>
		{/if}
	</form>

	<form method="POST" action="/auth/logout" class="text-center">
		<button type="submit" class="text-xs font-bold text-zinc-400 hover:text-zinc-600">
			{t(lang, 'Masuk sebagai', 'Signed in as')} {data.user.userEmail} · {t(lang, 'Keluar', 'Sign out')}
		</button>
	</form>
</div>
