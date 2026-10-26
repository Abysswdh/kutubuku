<script lang="ts">
	import type { PageProps } from './$types';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import StreakWeek from '$lib/components/StreakWeek.svelte';
	import BookCard from '$lib/components/BookCard.svelte';
	import StatCard from '$lib/components/StatCard.svelte';

	let { data }: PageProps = $props();

	let stats = $derived(data.stats);
	let dailyGoal = $derived(data.dailyGoal);
	let currentlyReading = $derived(data.currentlyReading);
	let weekDays = $derived(data.weekDays);

	// Daily goal calculations
	let pagesLeft = $derived(Math.max(0, dailyGoal.targetPages - stats.todayPagesRead));

	// XP level progress (each tier is 200 XP)
	let xpInCurrentTier = $derived(stats.totalXp % 200);
	let xpNeededForNext = $derived(200 - xpInCurrentTier);
</script>

<div class="space-y-5">
	<!-- Top Bar / Greeting & Streak -->
	<header class="flex items-center justify-between pt-1">
		<div>
			<p class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Book Journal</p>
			<h1 class="text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">
				Welcome back
			</h1>
		</div>

		<!-- Streak Badge -->
		<div
			class="flex min-h-[44px] items-center gap-2 rounded-2xl border border-zinc-200/90 bg-white px-3.5 py-1.5 shadow-2xs"
			title="{stats.streakDays} day reading streak"
			aria-label="{stats.streakDays} day streak"
		>
			<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-subtle text-accent">
				<svg
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path
						d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
					/>
				</svg>
			</div>
			<div class="flex flex-col">
				<span class="text-xs font-black text-zinc-900 leading-none">{stats.streakDays} Days</span>
				<span class="text-[10px] font-medium text-zinc-500">Streak</span>
			</div>
		</div>
	</header>

	<!-- Daily Goal Card with Progress Ring -->
	<section
		aria-labelledby="daily-goal-heading"
		class="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs"
	>
		<div class="flex items-center justify-between gap-4">
			<div class="space-y-1">
				<span
					id="daily-goal-heading"
					class="text-xs font-bold tracking-wider text-zinc-500 uppercase"
				>
					Today's Goal
				</span>
				<div class="flex items-baseline gap-1.5">
					<span class="text-3xl font-black tracking-tight text-zinc-900">
						{stats.todayPagesRead}
					</span>
					<span class="text-sm font-semibold text-zinc-500">
						/ {dailyGoal.targetPages} pages
					</span>
				</div>
				<p class="text-xs text-zinc-500">
					{#if pagesLeft === 0}
						<span class="font-semibold text-accent">Goal achieved!</span> Awesome reading today.
					{:else}
						<span>{pagesLeft} more pages</span> to reach today's target.
					{/if}
				</p>
			</div>

			<div class="shrink-0">
				<ProgressRing value={stats.todayPagesRead} max={dailyGoal.targetPages} size={76} strokeWidth={7} />
			</div>
		</div>
	</section>

	<!-- XP and Level Card -->
	<section
		aria-labelledby="level-heading"
		class="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs"
	>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-subtle text-accent font-black text-xs"
				>
					L{stats.currentLevel}
				</div>
				<div>
					<h2 id="level-heading" class="text-xs font-bold tracking-wider text-zinc-500 uppercase">
						Level {stats.currentLevel} Reader
					</h2>
					<p class="text-xs font-bold text-zinc-900">{stats.totalXp} Total XP</p>
				</div>
			</div>
			<span class="text-[11px] font-medium text-zinc-500">
				{xpNeededForNext} XP to Level {stats.currentLevel + 1}
			</span>
		</div>

		<div class="mt-3">
			<ProgressBar
				value={xpInCurrentTier}
				max={200}
				heightClass="h-2"
				ariaLabel="Experience points to next level"
			/>
		</div>
	</section>

	<!-- 7-Day Consistency Habit Strip -->
	<section aria-label="Weekly streak habit">
		<StreakWeek days={weekDays} />
	</section>

	<!-- Currently Reading Section -->
	<section aria-labelledby="currently-reading-heading" class="space-y-2">
		<div class="flex items-center justify-between px-1">
			<h2
				id="currently-reading-heading"
				class="text-xs font-bold tracking-wider text-zinc-700 uppercase"
			>
				Currently Reading
			</h2>
			{#if currentlyReading}
				<a
					href="/books/{currentlyReading.id}"
					class="text-xs font-semibold text-accent hover:underline"
				>
					View details
				</a>
			{/if}
		</div>

		{#if currentlyReading}
			<BookCard book={currentlyReading} showLogButton={true} />
		{:else}
			<div
				class="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-zinc-500"
			>
				<p class="text-sm">No book currently in progress.</p>
			</div>
		{/if}
	</section>
</div>
