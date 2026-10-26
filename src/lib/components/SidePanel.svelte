<script lang="ts">
	import type { Book, ReadingSession, WeeklyPlanPreview } from '$lib/types';

	interface Props {
		weeklyPlan: WeeklyPlanPreview;
		recentSessions: ReadingSession[];
		books?: Book[];
	}

	let { weeklyPlan, recentSessions, books = [] }: Props = $props();

	function getBookTitle(bookId: string): string {
		const found = books.find((b) => b.id === bookId);
		return found ? found.title : 'Current Book';
	}
</script>

<aside class="space-y-4" aria-label="Desktop Reading Companion">
	<!-- Next Week's AI Plan (Preview) -->
	<div class="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
		<div class="flex items-center justify-between">
			<span
				class="inline-flex items-center gap-1.5 rounded-md bg-accent-subtle px-2 py-0.5 text-xs font-bold text-accent"
			>
				<svg
					class="h-3.5 w-3.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path
						d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
					/>
				</svg>
				AI Plan Preview
			</span>
			<span class="text-[11px] font-semibold text-zinc-400">Next Week</span>
		</div>

		<div class="mt-3">
			<h3 class="text-sm font-bold text-zinc-900">
				Suggested: {weeklyPlan.targetPagesPerDay} pages / day
			</h3>
			<p class="mt-1 text-xs text-zinc-600 leading-relaxed">
				{weeklyPlan.rationale}
			</p>
		</div>

		<div class="mt-3.5 flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-xs">
			<span class="text-zinc-500">Target book:</span>
			<span class="font-bold text-zinc-900">{weeklyPlan.recommendedBookTitle}</span>
		</div>

		<p class="mt-3 text-[11px] text-zinc-400 leading-normal">
			The AI planner analyzes your logged reading sessions to generate achievable weekly targets.
		</p>
	</div>

	<!-- Recent Activity (Unique to desktop side panel) -->
	<div class="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
		<div class="flex items-center justify-between">
			<h3 class="text-xs font-bold tracking-wider text-zinc-500 uppercase">
				Recent Activity
			</h3>
			<span class="text-[11px] text-zinc-400">Latest logs</span>
		</div>

		<ul class="mt-3 divide-y divide-zinc-100" role="list">
			{#each recentSessions.slice(0, 3) as session (session.id)}
				<li class="py-2.5 first:pt-0 last:pb-0">
					<div class="flex items-baseline justify-between text-xs">
						<span class="font-semibold text-zinc-900">
							+{session.pagesRead} pages read
						</span>
						<time datetime={session.loggedAt} class="text-[11px] text-zinc-400">
							{session.loggedAt}
						</time>
					</div>
					<p class="mt-0.5 truncate text-[11px] text-zinc-500">
						in {getBookTitle(session.bookId)}
						{#if session.minutesRead}
							• {session.minutesRead} min
						{/if}
					</p>
				</li>
			{/each}
		</ul>
	</div>

	<!-- Reading Tip Card -->
	<div class="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 text-xs text-zinc-500">
		<p class="font-semibold text-zinc-800">Reading Habit Tip</p>
		<p class="mt-1 leading-relaxed">
			Consistency beats session length. Reading 15 pages every day totals 18 books a year.
		</p>
	</div>
</aside>
