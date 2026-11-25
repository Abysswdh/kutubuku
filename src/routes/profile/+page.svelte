<script lang="ts">
	import { page } from '$app/state';
	import { t, type Lang } from '$lib/i18n';
	import type { PageProps } from './$types';
	import BadgesRow from '$lib/components/BadgesRow.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';

	let { data }: PageProps = $props();

	let lang = $derived<Lang>(page.data.lang === 'en' ? 'en' : 'id');
	let stats = $derived(data.stats);
	let challenge = $derived(data.challenge);
	let badges = $derived(data.badges);
	let books = $derived(data.books);
	let recentSessions = $derived(data.recentSessions);

	let xpInCurrentTier = $derived(stats.totalXp % 200);
	let completedBooksCount = $derived(books.filter((b) => b.status === 'completed').length);
	let copiedShare = $state(false);

	async function handleShareProfile() {
		const shareUrl = `${window.location.origin}/u/${stats.id}`;
		try {
			await navigator.clipboard.writeText(shareUrl);
			copiedShare = true;
			setTimeout(() => (copiedShare = false), 2500);
		} catch {
			window.open(shareUrl, '_blank');
		}
	}

	let initials = $derived(
		(stats.userName ?? 'Reader')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0]?.toUpperCase() ?? '')
			.join('') || 'KB'
	);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-extrabold tracking-tight text-zinc-900">
			{t(lang, 'Profil', 'Profile')}
		</h1>
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={handleShareProfile}
				class="rounded-xl border-2 border-accent/30 bg-accent-subtle px-3 py-1.5 text-xs font-extrabold text-accent-text transition hover:bg-accent-muted"
			>
				{copiedShare ? t(lang, '✓ Tautan Disalin!', '✓ Link Copied!') : t(lang, '🔗 Bagikan', '🔗 Share')}
			</button>
			<form method="POST" action="/auth/logout">
				<button
					type="submit"
					class="rounded-xl border-2 border-zinc-200 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
				>
					{t(lang, 'Keluar', 'Sign Out')}
				</button>
			</form>
		</div>
	</div>

	<!-- Simple User Header Card -->
	<section class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-4">
		<div class="flex items-center gap-4">
			<div
				class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-black text-white"
			>
				{initials}
			</div>
			<div class="flex-1">
				<h2 class="text-lg font-extrabold text-zinc-900">{stats.userName ?? t(lang, 'Pembaca', 'Reader')}</h2>
				<p class="text-xs font-semibold text-zinc-400">
					Level {stats.currentLevel} • {stats.totalXp} Total XP • {t(lang, 'Streak Terpanjang', 'Longest Streak')}: {stats.longestStreak ?? stats.streakDays}{t(lang, 'h', 'd')}
				</p>
			</div>
		</div>

		<ProgressBar
			value={xpInCurrentTier}
			max={200}
			sublabel="{xpInCurrentTier} / 200 XP {t(lang, `menuju Level ${stats.currentLevel + 1}`, `to Level ${stats.currentLevel + 1}`)}"
			heightClass="h-2"
		/>

		<!-- Quick Statistics Grid -->
		<div class="grid grid-cols-3 gap-2.5 pt-1">
			<div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
				<div class="text-lg font-black text-zinc-900">🔥 {stats.streakDays}</div>
				<div class="text-[11px] font-bold text-zinc-400 uppercase">{t(lang, 'Streak Hari', 'Day Streak')}</div>
			</div>
			<div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
				<div class="text-lg font-black text-zinc-900">⚡ {stats.totalXp}</div>
				<div class="text-[11px] font-bold text-zinc-400 uppercase">Total XP</div>
			</div>
			<div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
				<div class="text-lg font-black text-zinc-900">📚 {completedBooksCount}</div>
				<div class="text-[11px] font-bold text-zinc-400 uppercase">{t(lang, 'Selesai', 'Finished')}</div>
			</div>
		</div>
	</section>

	<!-- Annual Reading Challenge Card -->
	<section class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-3.5">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-extrabold text-zinc-900">
				🏆 {t(lang, `Tantangan Baca ${challenge.challengeYear}`, `${challenge.challengeYear} Reading Challenge`)}
			</h2>
			<span class="rounded-lg bg-reward-subtle px-2.5 py-0.5 text-[11px] font-extrabold text-reward-text">
				{challenge.completedBooks} / {challenge.targetBooks} {t(lang, 'Buku', 'Books')}
			</span>
		</div>

		<ProgressBar
			value={challenge.completedBooks}
			max={challenge.targetBooks}
			sublabel={t(
				lang,
				`Target Buku Tahunan: ${challenge.completedBooks} dari ${challenge.targetBooks} buku selesai`,
				`Annual Book Target: ${challenge.completedBooks} of ${challenge.targetBooks} books finished`
			)}
			heightClass="h-2"
		/>

		<ProgressBar
			value={challenge.completedPages}
			max={challenge.targetPages}
			sublabel={t(
				lang,
				`Target Halaman Tahunan: ${challenge.completedPages} dari ${challenge.targetPages} halaman terbaca`,
				`Annual Page Target: ${challenge.completedPages} of ${challenge.targetPages} pages read`
			)}
			heightClass="h-2"
		/>
	</section>

	<!-- Badges & Milestones -->
	<section aria-label={t(lang, 'Lencana dan pencapaian', 'Badges and milestones')}>
		<BadgesRow {badges} />
	</section>

	<!-- Recent Logs -->
	<section class="space-y-3">
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-zinc-200"></div>
			<h2 class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
				{t(lang, 'Catatan Baca Terbaru', 'Recent Progress Logs')}
			</h2>
			<div class="h-px flex-1 bg-zinc-200"></div>
		</div>

		{#if recentSessions.length === 0}
			<div class="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-5 text-center text-xs font-semibold text-zinc-400">
				{t(lang, 'Belum ada sesi baca tercatat.', 'No reading sessions logged yet.')}
			</div>
		{:else}
			<ul class="space-y-2">
				{#each recentSessions as session (session.id)}
					<li class="flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-xs">
						<div>
							<span class="font-extrabold text-zinc-900">
								+{session.pagesRead} {t(lang, 'halaman dibaca', 'pages read')}
								{#if session.startPage !== undefined && session.currentPage !== undefined}
									<span class="font-semibold text-zinc-400">
										({t(lang, 'hlm.', 'p.')} {session.startPage} → {session.currentPage})
									</span>
								{/if}
							</span>
							{#if session.notes}
								<p class="mt-0.5 text-zinc-500 truncate max-w-xs">“{session.notes}”</p>
							{/if}
						</div>
						<span class="font-bold text-zinc-400">{session.loggedAt}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
