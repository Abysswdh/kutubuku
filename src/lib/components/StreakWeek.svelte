<script lang="ts">
	import type { WeekDayLog } from '$lib/types';

	interface Props {
		days: WeekDayLog[];
	}

	let { days }: Props = $props();
</script>

<div class="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
	<div class="mb-3 flex items-center justify-between">
		<div class="flex items-center gap-1.5">
			<svg
				class="h-4 w-4 text-accent"
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
			<h3 class="text-xs font-semibold tracking-wide text-zinc-700 uppercase">This Week</h3>
		</div>
		<span class="text-xs text-zinc-500">
			{days.filter((d) => d.hasLogged).length} of 7 days logged
		</span>
	</div>

	<div class="grid grid-cols-7 gap-1.5 sm:gap-2">
		{#each days as day (day.date)}
			<div
				class="flex flex-col items-center gap-1.5"
				title="{day.dayName}: {day.pagesRead} pages"
				aria-label="{day.dayName}: {day.hasLogged ? `${day.pagesRead} pages logged` : 'No reading logged'}"
			>
				<span
					class="text-[11px] font-medium {day.isToday ? 'font-bold text-accent' : 'text-zinc-500'}"
				>
					{day.dayLabel}
				</span>

				<div
					class="flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold transition-all {day.hasLogged
						? 'border-accent bg-accent text-white shadow-2xs'
						: day.isToday
							? 'border-dashed border-accent/70 bg-accent-subtle/50 text-accent'
							: 'border-zinc-200 bg-zinc-50 text-zinc-400'}"
				>
					{#if day.hasLogged}
						<!-- Checkmark icon -->
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					{:else if day.isToday}
						<span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
					{:else}
						<span class="text-[10px] text-zinc-300">·</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
