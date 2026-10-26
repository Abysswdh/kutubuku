<script lang="ts">
	import type { DailyGoal, UserStats } from '$lib/types';
	import ProgressBar from './ProgressBar.svelte';

	interface Props {
		stats: UserStats;
		dailyGoal: DailyGoal;
	}

	let { stats, dailyGoal }: Props = $props();

	let goalPercent = $derived(
		Math.min(100, Math.round((stats.todayPagesRead / dailyGoal.targetPages) * 100))
	);
</script>

<aside class="space-y-4" aria-label="Desktop Reading Summary">
	<!-- Streak Card -->
	<div class="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
		<div class="flex items-center gap-2 text-accent">
			<svg
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path
					d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
				/>
			</svg>
			<span class="text-xs font-bold tracking-wider uppercase">Active Streak</span>
		</div>
		<div class="mt-2 flex items-baseline gap-2">
			<span class="text-3xl font-black text-zinc-900">{stats.streakDays}</span>
			<span class="text-sm font-medium text-zinc-500">consecutive days</span>
		</div>
		<p class="mt-1 text-xs text-zinc-500 leading-relaxed">
			Log at least 1 page today to protect your streak.
		</p>
	</div>

	<!-- Daily Goal Card -->
	<div class="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
		<div class="flex items-center justify-between">
			<span class="text-xs font-bold tracking-wider text-zinc-500 uppercase">Daily Goal</span>
			<span class="text-xs font-semibold text-accent">{goalPercent}%</span>
		</div>
		<div class="mt-2 text-lg font-bold text-zinc-900">
			{stats.todayPagesRead} <span class="text-xs font-normal text-zinc-500">/ {dailyGoal.targetPages} pages</span>
		</div>
		<div class="mt-2">
			<ProgressBar value={stats.todayPagesRead} max={dailyGoal.targetPages} />
		</div>
	</div>

	<!-- Level Progress Card -->
	<div class="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
		<div class="flex items-center justify-between text-xs">
			<span class="font-bold tracking-wider text-zinc-500 uppercase">Rank & Level</span>
			<span class="font-semibold text-zinc-900">Level {stats.currentLevel}</span>
		</div>
		<div class="mt-2">
			<ProgressBar
				value={stats.totalXp % 200}
				max={200}
				sublabel="{stats.totalXp} Total XP"
			/>
		</div>
		<p class="mt-2 text-[11px] text-zinc-400">
			Earn XP by logging daily reading sessions.
		</p>
	</div>
</aside>
