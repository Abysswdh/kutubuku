<script lang="ts">
	import type { PageProps } from './$types';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import BookCard from '$lib/components/BookCard.svelte';

	let { data }: PageProps = $props();

	let stats = $derived(data.stats);
	let dailyGoal = $derived(data.dailyGoal);
	let currentlyReading = $derived(data.currentlyReading);
	let books = $derived(data.books);

	let isGoalReached = $derived(stats.todayPagesRead >= dailyGoal.targetPages);
	let pagesRemaining = $derived(Math.max(0, dailyGoal.targetPages - stats.todayPagesRead));
</script>

<div class="space-y-6">
	<h1 class="text-xl font-extrabold tracking-tight text-zinc-900">
		Reading Journal
	</h1>

	<!-- Simple Daily Goal Card -->
	<section
		aria-labelledby="daily-goal-heading"
		class="rounded-2xl border-2 border-zinc-200 bg-white p-5"
	>
		<div class="flex items-center justify-between gap-4">
			<div class="space-y-1">
				<h2
					id="daily-goal-heading"
					class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase"
				>
					Today's Goal
				</h2>

				<div class="flex items-baseline gap-1.5">
					<span class="text-3xl font-black text-zinc-900">
						{stats.todayPagesRead}
					</span>
					<span class="text-sm font-bold text-zinc-400">
						/ {dailyGoal.targetPages} pages
					</span>
				</div>

				<p class="text-xs font-medium text-zinc-500">
					{#if isGoalReached}
						<span class="font-bold text-reward-text">Goal reached! +20 bonus XP earned.</span>
					{:else}
						{pagesRemaining} more pages to hit today's goal.
					{/if}
				</p>
			</div>

			<div class="shrink-0">
				<ProgressRing
					value={stats.todayPagesRead}
					max={dailyGoal.targetPages}
					size={76}
					strokeWidth={7}
					isCelebratory={isGoalReached}
				/>
			</div>
		</div>

		{#if currentlyReading}
			<a
				href="/books/{currentlyReading.id}"
				class="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-xs font-extrabold tracking-wider text-white uppercase transition-colors hover:bg-accent-hover"
			>
				+ Log Reading Session
			</a>
		{/if}
	</section>

	<!-- Books List -->
	<section aria-labelledby="books-heading" class="space-y-3">
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-zinc-200"></div>
			<h2 id="books-heading" class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
				Your Books
			</h2>
			<div class="h-px flex-1 bg-zinc-200"></div>
		</div>

		<div class="space-y-3">
			{#each books as book (book.id)}
				<BookCard {book} showLogButton={book.status === 'reading'} />
			{/each}
		</div>
	</section>
</div>
