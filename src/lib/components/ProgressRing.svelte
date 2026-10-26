<script lang="ts">
	interface Props {
		value: number;
		max?: number;
		size?: number;
		strokeWidth?: number;
		label?: string;
		sublabel?: string;
	}

	let {
		value,
		max = 100,
		size = 88,
		strokeWidth = 7,
		label,
		sublabel
	}: Props = $props();

	let percentage = $derived(
		max <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((value / max) * 100)))
	);

	let radius = $derived((size - strokeWidth) / 2);
	let circumference = $derived(2 * Math.PI * radius);
	let strokeDashoffset = $derived(circumference - (percentage / 100) * circumference);
</script>

<div
	class="flex flex-col items-center justify-center"
	role="progressbar"
	aria-valuenow={value}
	aria-valuemin={0}
	aria-valuemax={max}
	aria-label={label ?? 'Daily goal progress'}
>
	<div class="relative flex items-center justify-center" style="width: {size}px; height: {size}px;">
		<svg
			width={size}
			height={size}
			viewBox="0 0 {size} {size}"
			class="-rotate-90 transform"
			aria-hidden="true"
		>
			<!-- Background Track -->
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				stroke="#e4e4e7"
				stroke-width={strokeWidth}
				fill="transparent"
			/>
			<!-- Animated Progress Indicator -->
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				stroke="var(--color-accent)"
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-dasharray={circumference}
				stroke-dashoffset={strokeDashoffset}
				fill="transparent"
				class="transition-[stroke-dashoffset] duration-500 ease-out"
			/>
		</svg>

		<!-- Center content -->
		<div class="absolute inset-0 flex flex-col items-center justify-center text-center">
			<span class="text-base font-bold tracking-tight text-zinc-900 leading-none">
				{percentage}%
			</span>
		</div>
	</div>

	{#if label}
		<span class="mt-2 text-xs font-semibold text-zinc-800">{label}</span>
	{/if}
	{#if sublabel}
		<span class="text-[11px] text-zinc-500">{sublabel}</span>
	{/if}
</div>
