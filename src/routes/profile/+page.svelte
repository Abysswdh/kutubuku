<script lang="ts">
	import type { PageProps } from './$types';
	import BadgesRow from '$lib/components/BadgesRow.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';

	let { data }: PageProps = $props();

	let stats = $derived(data.stats);
	let badges = $derived(data.badges);
	let books = $derived(data.books);
	let recentSessions = $derived(data.recentSessions);

	let xpInCurrentTier = $derived(stats.totalXp % 200);
	let completedBooksCount = $derived(books.filter((b) => b.status === 'completed').length);
</script>

<div class="space-y-6">
	<h1 class="text-xl font-extrabold tracking-tight text-zinc-900">
		Profile
	</h1>

	<!-- Simple User Header Card -->
	<section class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-4">
		<div class="flex items-center gap-4">
			<div
				class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-black text-white"
			>
				KB
			</div>
			<div class="flex-1">
				<h2 class="text-lg font-extrabold text-zinc-900">Reader</h2>
				<p class="text-xs font-semibold text-zinc-400">
					Level {stats.currentLevel} • {stats.totalXp} Total XP
				</p>
			</div>
		</div>

		<ProgressBar
			value={xpInCurrentTier}
			max={200}
			sublabel="{xpInCurrentTier} / 200 XP to Level {stats.currentLevel + 1}"
			heightClass="h-2"
		/>

		<!-- Quick Statistics Grid -->
		<div class="grid grid-cols-3 gap-2.5 pt-1">
			<div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
				<div class="text-lg font-black text-zinc-900">🔥 {stats.streakDays}</div>
				<div class="text-[11px] font-bold text-zinc-400 uppercase">Day Streak</div>
			</div>
			<div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
				<div class="text-lg font-black text-zinc-900">⚡ {stats.totalXp}</div>
				<div class="text-[11px] font-bold text-zinc-400 uppercase">Total XP</div>
			</div>
			<div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
				<div class="text-lg font-black text-zinc-900">📚 {completedBooksCount}</div>
				<div class="text-[11px] font-bold text-zinc-400 uppercase">Finished</div>
			</div>
		</div>
	</section>

	<!-- Badges & Milestones -->
	<section aria-label="Badges and milestones">
		<BadgesRow {badges} />
	</section>

	<!-- Recent Logs -->
	<section class="space-y-3">
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-zinc-200"></div>
			<h2 class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
				Recent Activity
			</h2>
			<div class="h-px flex-1 bg-zinc-200"></div>
		</div>

		<ul class="space-y-2">
			{#each recentSessions as session (session.id)}
				<li class="flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-xs">
					<div>
						<span class="font-extrabold text-zinc-900">+{session.pagesRead} pages read</span>
						{#if session.notes}
							<p class="mt-0.5 text-zinc-500 truncate max-w-xs">“{session.notes}”</p>
						{/if}
					</div>
					<span class="font-bold text-zinc-400">{session.loggedAt}</span>
				</li>
			{/each}
		</ul>
	</section>
</div>

