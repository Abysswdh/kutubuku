<script lang="ts">
	interface Props {
		value: number;
		max?: number;
		size?: number;
		strokeWidth?: number;
		label?: string;
		sublabel?: string;
		isCelebratory?: boolean;
	}

	let {
		value,
		max = 100,
		size = 96,
		strokeWidth = 8,
		label,
		sublabel,
		isCelebratory = false
	}: Props = $props();

	let isCompleted = $derived(max > 0 && value >= max);

	let percentage = $derived(
		max <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((value / max) * 100)))
	);

	let radius = $derived((size - strokeWidth) / 2);
	let circumference = $derived(2 * Math.PI * radius);
	let strokeDashoffset = $derived(circumference - (percentage / 100) * circumference);

	// Ring color changes to warm reward gold when completed, otherwise teal accent
	let strokeColor = $derived(
		isCompleted || isCelebratory ? 'var(--color-reward)' : 'var(--color-accent)'
	);
</script>

<div
	class="flex flex-col items-center justify-center"
	role="progressbar"
	aria-valuenow={value}
	aria-valuemin={0}
	aria-valuemax={max}
	aria-label={label ?? 'Daily goal progress'}
>
	<div
		class="relative flex items-center justify-center transition-transform duration-300"
		style="width: {size}px; height: {size}px;"
	>
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
			<!-- Animated Progress Arc -->
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				stroke={strokeColor}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-dasharray={circumference}
				stroke-dashoffset={strokeDashoffset}
				fill="transparent"
				class="transition-[stroke-dashoffset,stroke] duration-500 ease-out"
			/>
		</svg>

		<!-- Center Content -->
		<div class="absolute inset-0 flex flex-col items-center justify-center text-center">
			{#if isCompleted}
				<!-- Subtle checkmark when goal reached -->
				<svg
					class="h-7 w-7 text-reward transition-transform duration-300"
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
				<span class="mt-0.5 text-[10px] font-black text-reward">100%</span>
			{:else}
				<span class="text-xl font-black tracking-tight text-zinc-900 leading-none">
					{percentage}%
				</span>
				<span class="mt-0.5 text-[10px] font-medium text-zinc-400">done</span>
			{/if}
		</div>
	</div>

	{#if label}
		<span class="mt-2 text-xs font-semibold text-zinc-800">{label}</span>
	{/if}
	{#if sublabel}
		<span class="text-[11px] text-zinc-500">{sublabel}</span>
	{/if}
</div>
