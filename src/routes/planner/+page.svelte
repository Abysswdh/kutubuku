<script lang="ts">
	import type { PageProps } from './$types';
	import StreakWeek from '$lib/components/StreakWeek.svelte';

	let { data }: PageProps = $props();

	let weekDays = $derived(data.weekDays);
	let weeklyPlan = $derived(data.weeklyPlan);
	let wantToRead = $derived(data.books.filter((b) => b.status !== 'completed'));
</script>

<div class="space-y-6">
	<h1 class="text-xl font-extrabold tracking-tight text-zinc-900">
		Reading Planner
	</h1>

	<!-- 7-Day Habit Strip -->
	<StreakWeek days={weekDays} />

	<!-- Weekly Plan Card -->
	<section class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-3">
		<div class="flex items-center justify-between">
			<span class="rounded-lg bg-accent-subtle px-2.5 py-1 text-xs font-extrabold text-accent uppercase">
				Weekly Target
			</span>
			<span class="text-xs font-bold text-zinc-400">
				~{weeklyPlan.projectedWeeklyPages} pages / week
			</span>
		</div>

		<div>
			<h2 class="text-lg font-extrabold text-zinc-900">
				{weeklyPlan.targetPagesPerDay} pages per day
			</h2>
			<p class="mt-1 text-xs text-zinc-600 leading-relaxed">
				{weeklyPlan.rationale}
			</p>
		</div>

		<div class="flex items-center justify-between rounded-xl bg-zinc-50 px-3.5 py-2.5 text-xs">
			<span class="font-semibold text-zinc-500">Focus Book</span>
			<span class="font-extrabold text-zinc-900">{weeklyPlan.recommendedBookTitle}</span>
		</div>
	</section>

	<!-- Reading Queue -->
	<section class="space-y-3">
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-zinc-200"></div>
			<h2 class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
				Reading Queue
			</h2>
			<div class="h-px flex-1 bg-zinc-200"></div>
		</div>

		<div class="space-y-2.5">
			{#each wantToRead as book (book.id)}
				<a
					href="/books/{book.id}"
					class="flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300"
				>
					<div>
						<h3 class="text-sm font-extrabold text-zinc-900">{book.title}</h3>
						<p class="text-xs text-zinc-500">{book.author} • {book.totalPages} pages</p>
					</div>
					<span
						class="rounded-lg px-2.5 py-1 text-[11px] font-extrabold uppercase {book.status === 'reading'
							? 'bg-accent-subtle text-accent'
							: 'bg-zinc-100 text-zinc-500'}"
					>
						{book.status === 'reading' ? 'Reading' : 'Up Next'}
					</span>
				</a>
			{/each}
		</div>
	</section>
</div>

