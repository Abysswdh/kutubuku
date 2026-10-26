<script lang="ts">
	interface Props {
		value: number;
		max?: number;
		label?: string;
		sublabel?: string;
		showPercentage?: boolean;
		heightClass?: string;
		ariaLabel?: string;
	}

	let {
		value,
		max = 100,
		label,
		sublabel,
		showPercentage = false,
		heightClass = 'h-2',
		ariaLabel
	}: Props = $props();

	let percentage = $derived(
		max <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((value / max) * 100)))
	);
</script>

<div class="w-full">
	{#if label || sublabel || showPercentage}
		<div class="mb-1.5 flex items-baseline justify-between text-xs">
			{#if label}
				<span class="font-medium text-zinc-700">{label}</span>
			{/if}
			<div class="flex items-center gap-2">
				{#if sublabel}
					<span class="text-zinc-500">{sublabel}</span>
				{/if}
				{#if showPercentage}
					<span class="font-semibold text-zinc-900">{percentage}%</span>
				{/if}
			</div>
		</div>
	{/if}

	<div
		class="relative w-full overflow-hidden rounded-full bg-zinc-100 {heightClass} border border-zinc-200/50"
		role="progressbar"
		aria-valuenow={value}
		aria-valuemin={0}
		aria-valuemax={max}
		aria-label={ariaLabel ?? label ?? 'Progress'}
	>
		<div
			class="h-full rounded-full bg-accent transition-all duration-300 ease-out"
			style="width: {percentage}%"
		></div>
	</div>
</div>
