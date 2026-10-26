<script lang="ts">
	import type { PageProps } from './$types';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import StreakWeek from '$lib/components/StreakWeek.svelte';
	import BookCard from '$lib/components/BookCard.svelte';
	import BadgesRow from '$lib/components/BadgesRow.svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let { data }: PageProps = $props();

	let stats = $derived(data.stats);
	let dailyGoal = $derived(data.dailyGoal);
	let currentlyReading = $derived(data.currentlyReading);
	let weekDays = $derived(data.weekDays);
	let badges = $derived(data.badges);

	// Daily goal calculations
	let isGoalReached = $derived(stats.todayPagesRead >= dailyGoal.targetPages);
	let pagesRemaining = $derived(Math.max(0, dailyGoal.targetPages - stats.todayPagesRead));

	// XP level progress (each tier is 200 XP)
	let xpInCurrentTier = $derived(stats.totalXp % 200);
	let xpNeededForNext = $derived(200 - xpInCurrentTier);

	// Svelte 5 Tween for smooth XP count-up
	let xpDisplay = new Tween(0, { duration: 700, easing: cubicOut });
	$effect(() => {
		xpDisplay.target = stats.totalXp;
	});
</script>

<div class="space-y-6">
	<!-- Top Bar: Greeting, Level with Thin XP bar, and Streak in Header -->
	<header class="flex items-start justify-between gap-3 pt-1">
		<div class="flex-1 space-y-1.5">
			<div>
				<h1 class="text-2xl font-black tracking-tight text-zinc-900">
					Happy reading
				</h1>
				<!-- Level and XP directly under greeting (replaces separate level card) -->
				<div class="mt-1 flex items-center gap-2 text-xs text-zinc-500">
					<span class="font-bold text-zinc-800">Level {stats.currentLevel}</span>
					<span>•</span>
					<span class="font-medium text-reward">
						{Math.round(xpDisplay.current)} XP
					</span>
					<span class="text-zinc-400">({xpNeededForNext} to Level {stats.currentLevel + 1})</span>
				</div>
			</div>

			<!-- Sleek, thin XP progress bar -->
			<div class="max-w-[240px]">
				<ProgressBar
					value={xpInCurrentTier}
					max={200}
					heightClass="h-1.5"
					ariaLabel="Level {stats.currentLevel} XP progress"
				/>
			</div>
		</div>

		<!-- Streak Badge (Shown ONLY here in the header with warm reward amber & gentle flame animation) -->
		<div
			class="flex min-h-[44px] items-center gap-2 rounded-2xl border border-reward-muted bg-reward-subtle/60 px-3.5 py-1.5 shadow-2xs"
			title="{stats.streakDays} day reading streak"
			aria-label="{stats.streakDays} day streak"
		>
			<span class="animate-flame text-reward" aria-hidden="true">
				<svg
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="currentColor"
					stroke="none"
				>
					<path
						d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
					/>
				</svg>
			</span>
			<div class="flex flex-col">
				<span class="text-sm font-black text-zinc-900 leading-none">
					{stats.streakDays} Days
				</span>
				<span class="text-[10px] font-semibold text-reward-text">Streak</span>
			</div>
		</div>
	</header>

	<!-- HERO CARD: Today's Daily Goal with Large Progress Ring & Dominant CTA -->
	<section
		aria-labelledby="daily-goal-heading"
		class="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-xs transition-colors"
	>
		<div class="flex items-center justify-between gap-6">
			<div class="flex-1 space-y-2">
				<div class="flex items-center gap-2">
					<h2
						id="daily-goal-heading"
						class="text-xs font-bold tracking-wider text-zinc-500 uppercase"
					>
						Today's Reading Goal
					</h2>
					{#if isGoalReached}
						<span
							class="rounded-full bg-reward-subtle px-2 py-0.5 text-[10px] font-bold text-reward border border-reward-muted"
						>
							Goal Reached!
						</span>
					{/if}
				</div>

				<!-- Single prominent big number -->
				<div class="flex items-baseline gap-2">
					<span class="text-4xl font-black tracking-tight text-zinc-900">
						{stats.todayPagesRead}
					</span>
					<span class="text-base font-semibold text-zinc-500">
						/ {dailyGoal.targetPages} pages
					</span>
				</div>

				<p class="text-sm text-zinc-600 leading-relaxed">
					{#if isGoalReached}
						<span class="font-bold text-reward-text">Daily target achieved!</span> You earned +20 bonus XP today.
					{:else}
						<span>{pagesRemaining} more pages</span> to reach today's target and protect your streak.
					{/if}
				</p>
			</div>

			<!-- Large Hero Progress Ring -->
			<div class="shrink-0">
				<ProgressRing
					value={stats.todayPagesRead}
					max={dailyGoal.targetPages}
					size={96}
					strokeWidth={8}
					isCelebratory={isGoalReached}
				/>
			</div>
		</div>

		<!-- Clear, dominant Hero Call To Action: Log Session -->
		<div class="mt-5 border-t border-zinc-100 pt-4">
			{#if currentlyReading}
				<a
					href="/books/{currentlyReading.id}"
					class="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-accent-hover active:bg-accent-text"
					aria-label="Log session for {currentlyReading.title}"
				>
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
						<path d="M12 5v14M5 12h14" />
					</svg>
					Log session for {currentlyReading.title}
				</a>
			{:else}
				<a
					href="/books/book-1"
					class="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-accent-hover"
				>
					Log today's reading
				</a>
			{/if}
		</div>
	</section>

	<!-- Badges Row: Locked and Unlocked States -->
	<section aria-label="Reading badges">
		<BadgesRow {badges} />
	</section>

	<!-- Compact 7-Day Habit Strip -->
	<section aria-label="Weekly streak habit">
		<StreakWeek days={weekDays} />
	</section>

	<!-- Currently Reading (Secondary Card) -->
	<section aria-labelledby="currently-reading-heading" class="space-y-2.5">
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
					Manage book
				</a>
			{/if}
		</div>

		{#if currentlyReading}
			<BookCard book={currentlyReading} showLogButton={false} />
		{:else}
			<div
				class="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500"
			>
				No book currently in progress.
			</div>
		{/if}
	</section>
</div>
