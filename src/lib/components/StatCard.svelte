<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		value?: string | number;
		subtext?: string;
		badge?: string;
		icon?: Snippet;
		children?: Snippet;
	}

	let { title, value, subtext, badge, icon, children }: Props = $props();
</script>

<div class="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			{#if icon}
				<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
					{@render icon()}
				</div>
			{/if}
			<h3 class="text-xs font-semibold tracking-wide text-zinc-500 uppercase">{title}</h3>
		</div>
		{#if badge}
			<span class="rounded-full bg-accent-subtle px-2 py-0.5 text-[11px] font-medium text-accent">
				{badge}
			</span>
		{/if}
	</div>

	{#if value !== undefined}
		<div class="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
			{value}
		</div>
	{/if}

	{#if subtext}
		<p class="mt-0.5 text-xs text-zinc-500">{subtext}</p>
	{/if}

	{#if children}
		<div class="mt-3">
			{@render children()}
		</div>
	{/if}
</div>
