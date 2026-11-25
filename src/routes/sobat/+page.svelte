<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { t, type Lang } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let lang = $derived<Lang>(page.data.lang === 'en' ? 'en' : 'id');
	let activeTab = $state<'feed' | 'leaderboard' | 'find'>('feed');
	let searchQuery = $state('');
	let busyKey = $state<string | null>(null);

	let feed = $derived(data.feed);
	let leaderboard = $derived(data.leaderboard);
	let directory = $derived(data.directory);

	let followingCount = $derived(directory.filter((u) => u.isFollowing).length);

	let filteredDirectory = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return directory;
		return directory.filter(
			(u) => u.userName.toLowerCase().includes(q) || u.userEmail.toLowerCase().includes(q)
		);
	});

	async function handleCelebrate(activityKey: string) {
		if (busyKey) return;
		busyKey = activityKey;
		try {
			await fetch('/api/sobat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'celebrate', activityKey })
			});
			await invalidateAll();
		} finally {
			busyKey = null;
		}
	}

	async function handleFollow(sobatUserId: string) {
		if (busyKey) return;
		busyKey = sobatUserId;
		try {
			await fetch('/api/sobat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'follow', sobatUserId })
			});
			await invalidateAll();
		} finally {
			busyKey = null;
		}
	}

	function rankBadge(index: number): string {
		if (index === 0) return '🥇';
		if (index === 1) return '🥈';
		if (index === 2) return '🥉';
		return `#${index + 1}`;
	}
</script>

<div class="space-y-5">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-extrabold tracking-tight text-zinc-900">Sobat</h1>
		<span class="rounded-lg bg-accent-subtle px-2.5 py-1 text-xs font-extrabold text-accent-text">
			{followingCount} {t(lang, 'mengikuti', 'following')}
		</span>
	</div>

	<!-- 3-Tab Switcher -->
	<div class="grid grid-cols-3 gap-1.5 rounded-2xl border-2 border-zinc-200 bg-white p-1.5 text-xs font-extrabold">
		<button
			type="button"
			onclick={() => (activeTab = 'feed')}
			class="rounded-xl py-2 transition {activeTab === 'feed'
				? 'bg-accent text-white'
				: 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}"
		>
			{t(lang, 'Aktivitas', 'Feed')}
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'leaderboard')}
			class="rounded-xl py-2 transition {activeTab === 'leaderboard'
				? 'bg-accent text-white'
				: 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}"
		>
			{t(lang, 'Peringkat', 'Leaderboard')}
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'find')}
			class="rounded-xl py-2 transition {activeTab === 'find'
				? 'bg-accent text-white'
				: 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}"
		>
			{t(lang, 'Cari', 'Find')}
		</button>
	</div>

	{#if activeTab === 'feed'}
		{#if feed.length === 0}
			<section class="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-6 text-center space-y-3">
				<div class="text-3xl" aria-hidden="true">📚</div>
				<div class="space-y-1">
					<h2 class="text-sm font-extrabold text-zinc-900">
						{t(lang, 'Kabar sobat masih sepi', 'Your sobat feed is quiet')}
					</h2>
					<p class="text-xs font-medium text-zinc-500">
						{t(lang, 'Ikuti beberapa sobat atau catat sesi bacamu untuk melihat pembaruan di sini.', 'Follow a few sobat or log a reading session to see updates here.')}
					</p>
				</div>
				<button
					type="button"
					onclick={() => (activeTab = 'find')}
					class="rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-white transition hover:bg-accent-hover"
				>
					{t(lang, 'Cari Sobat →', 'Find Sobat →')}
				</button>
			</section>
		{:else}
			<div class="space-y-3.5">
				{#each feed as item (item.activityKey)}
					<article class="rounded-2xl border-2 border-zinc-200 bg-white p-4">
						<div class="flex items-start justify-between gap-4">
							<div class="space-y-2">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
										style="background-color: {item.avatarBg}"
										aria-hidden="true"
									>
										{item.avatarInitials}
									</div>
									<div>
										<h2 class="text-sm font-extrabold text-zinc-900 leading-tight">
											{item.userName}
											{#if item.isSelf}
												<span class="ml-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">
													{t(lang, 'Kamu', 'You')}
												</span>
											{/if}
										</h2>
										<p class="text-xs font-medium text-zinc-400">{item.timeAgo}</p>
									</div>
								</div>

								<p class="text-sm font-semibold text-zinc-800">{item.message}</p>
								{#if item.subtext}
									<p class="text-xs font-medium text-zinc-500 italic">“{item.subtext}”</p>
								{/if}
							</div>

							<div
								class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-50 text-3xl"
								aria-hidden="true"
							>
								{item.badgeEmoji}
							</div>
						</div>

						<div class="mt-4 flex items-center justify-between">
							<button
								type="button"
								disabled={busyKey === item.activityKey}
								onclick={() => handleCelebrate(item.activityKey)}
								class="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 px-3.5 py-1.5 text-xs font-extrabold tracking-wider uppercase transition-colors disabled:opacity-60 {item.hasCelebrated
									? 'border-accent/30 bg-accent-subtle text-accent'
									: 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 active:translate-y-0.5'}"
							>
								<span aria-hidden="true">🎉</span>
								<span>{item.hasCelebrated ? t(lang, 'Dirayakan', 'Celebrated') : t(lang, 'Rayakan', 'Celebrate')}</span>
							</button>

							<div class="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
								<span
									class="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-xs"
									aria-hidden="true"
								>
									🎉
								</span>
								<span>{item.celebrations}</span>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	{:else if activeTab === 'leaderboard'}
		<section class="space-y-3">
			<div class="flex items-center justify-between px-1">
				<h2 class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
					{t(lang, '7 Hari Terakhir · Lingkaranmu', 'Last 7 Days · Your Circle')}
				</h2>
				{#if followingCount === 0}
					<button
						type="button"
						onclick={() => (activeTab = 'find')}
						class="text-xs font-extrabold text-accent hover:underline"
					>
						{t(lang, '+ Tambah sobat', '+ Add sobat')}
					</button>
				{/if}
			</div>

			<div class="space-y-2.5">
				{#each leaderboard as row, i (row.userId)}
					<div
						class="flex items-center justify-between rounded-2xl border-2 p-3.5 {row.isSelf
							? 'border-accent/40 bg-accent-subtle/60'
							: 'border-zinc-200 bg-white'}"
					>
						<div class="flex items-center gap-3 min-w-0">
							<div class="w-7 text-center text-sm font-black text-zinc-500">
								{rankBadge(i)}
							</div>
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
								style="background-color: {row.avatarBg}"
								aria-hidden="true"
							>
								{row.avatarInitials}
							</div>
							<div class="min-w-0">
								<div class="truncate text-sm font-extrabold text-zinc-900">
									{row.userName}
									{#if row.isSelf}
										<span class="ml-1 text-[11px] font-bold text-accent">({t(lang, 'Kamu', 'You')})</span>
									{/if}
								</div>
								<div class="text-xs font-semibold text-zinc-400">
									🔥 {row.streakDays}{t(lang, 'h', 'd')} streak · 📚 {row.booksFinished} {t(lang, 'selesai', 'finished')}
								</div>
							</div>
						</div>

						<div class="text-right shrink-0 pl-3">
							<div class="text-sm font-black text-zinc-900">{row.weeklyPages} {t(lang, 'hlm', 'p')}</div>
							<div class="text-[10px] font-bold text-zinc-400 uppercase">{t(lang, '7h halaman', '7d pages')}</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{:else}
		<section class="space-y-3.5">
			<input
				type="search"
				bind:value={searchQuery}
				placeholder={t(lang, 'Cari sobat pakai nama atau email...', 'Search sobat by name or email...')}
				class="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 focus:border-accent focus:outline-none"
			/>

			{#if filteredDirectory.length === 0}
				<div class="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-6 text-center text-xs font-bold text-zinc-400">
					{t(lang, `Tidak ada sobat yang cocok dengan “${searchQuery}”.`, `No sobat matched “${searchQuery}”.`)}
				</div>
			{:else}
				<div class="space-y-2.5">
					{#each filteredDirectory as mate (mate.userId)}
						<div class="flex items-center justify-between gap-3 rounded-2xl border-2 border-zinc-200 bg-white p-3.5">
							<div class="flex items-center gap-3 min-w-0">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
									style="background-color: {mate.avatarBg}"
									aria-hidden="true"
								>
									{mate.avatarInitials}
								</div>
								<div class="min-w-0">
									<div class="truncate text-sm font-extrabold text-zinc-900">{mate.userName}</div>
									<div class="truncate text-xs font-semibold text-zinc-400">
										🔥 {mate.streakDays}{t(lang, 'h', 'd')} · 📚 {mate.booksFinished} {t(lang, 'selesai', 'finished')}
									</div>
									{#if mate.currentBookTitle}
										<div class="truncate text-[11px] font-bold text-accent">
											{t(lang, 'Membaca:', 'Reading:')} {mate.currentBookTitle}
										</div>
									{/if}
								</div>
							</div>

							<button
								type="button"
								disabled={busyKey === mate.userId}
								onclick={() => handleFollow(mate.userId)}
								class="shrink-0 rounded-xl border-2 px-3.5 py-2 text-xs font-extrabold transition disabled:opacity-60 {mate.isFollowing
									? 'border-accent/30 bg-accent-subtle text-accent hover:border-red-200 hover:bg-red-50 hover:text-red-600'
									: 'border-accent bg-accent text-white hover:bg-accent-hover'}"
							>
								{mate.isFollowing ? t(lang, 'Mengikuti ✓', 'Following ✓') : t(lang, '+ Ikuti', '+ Follow')}
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>
