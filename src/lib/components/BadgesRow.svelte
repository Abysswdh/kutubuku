<script lang="ts">
	import type { Badge } from '$lib/types';

	interface Props {
		badges: Badge[];
	}

	let { badges }: Props = $props();
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between px-1">
		<h2 class="text-xs font-bold tracking-wider text-zinc-700 uppercase">
			Badges & Milestones
		</h2>
		<span class="text-xs text-zinc-500">
			{badges.filter((b) => b.isUnlocked).length} / {badges.length} Unlocked
		</span>
	</div>

	<div class="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
		{#each badges as badge (badge.id)}
			<div
				class="flex min-w-[120px] max-w-[135px] shrink-0 flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all {badge.isUnlocked
					? 'border-reward-muted bg-reward-subtle/50 text-reward shadow-2xs'
					: 'border-zinc-200/70 bg-white text-zinc-400'}"
				title="{badge.title}: {badge.description}"
				aria-label="{badge.title}: {badge.isUnlocked ? 'Unlocked' : 'Locked'}"
			>
				<!-- Icon Container -->
				<div
					class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl transition-colors {badge.isUnlocked
						? 'bg-reward text-white shadow-2xs'
						: 'bg-zinc-100 text-zinc-400'}"
				>
					{#if badge.icon === 'flame'}
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
					{:else if badge.icon === 'book'}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
							<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
						</svg>
					{:else if badge.icon === 'pages'}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="16" y1="13" x2="8" y2="13" />
							<line x1="16" y1="17" x2="8" y2="17" />
						</svg>
					{:else if badge.icon === 'target'}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="10" />
							<circle cx="12" cy="12" r="6" />
							<circle cx="12" cy="12" r="2" />
						</svg>
					{:else}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<polygon
								points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
							/>
						</svg>
					{/if}
				</div>

				<!-- Title -->
				<span
					class="line-clamp-2 text-[11px] font-bold leading-tight {badge.isUnlocked
						? 'text-zinc-900'
						: 'text-zinc-500'}"
				>
					{badge.title}
				</span>

				<!-- State indicator -->
				<div class="mt-1.5 flex items-center gap-1">
					{#if badge.isUnlocked}
						<span class="inline-flex items-center text-[10px] font-semibold text-reward">
							Unlocked
						</span>
					{:else}
						<span class="inline-flex items-center gap-0.5 text-[10px] text-zinc-400">
							<svg
								class="h-3 w-3"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
								<path d="M7 11V7a5 5 0 0 1 10 0v4" />
							</svg>
							Locked
						</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
