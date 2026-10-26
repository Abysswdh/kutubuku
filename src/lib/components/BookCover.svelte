<script lang="ts">
	interface Props {
		title: string;
		author?: string;
		genre?: string;
		size?: 'sm' | 'md' | 'lg';
	}

	let { title, author, genre, size = 'md' }: Props = $props();

	// Generate 1-2 letter initials from title words
	let initials = $derived(
		title
			.split(' ')
			.filter((w) => w.length > 0)
			.slice(0, 2)
			.map((w) => w[0].toUpperCase())
			.join('')
	);

	// Palette driven by genre
	let genreBgClass = $derived.by(() => {
		const g = (genre || '').toLowerCase();
		if (g.includes('self') || g.includes('habit')) return 'bg-teal-900 text-teal-100';
		if (g.includes('product') || g.includes('work')) return 'bg-slate-900 text-slate-100';
		if (g.includes('fict') || g.includes('novel')) return 'bg-indigo-950 text-indigo-100';
		if (g.includes('philo') || g.includes('mind')) return 'bg-amber-950 text-amber-100';
		if (g.includes('sci') || g.includes('tech')) return 'bg-cyan-950 text-cyan-100';
		return 'bg-zinc-900 text-zinc-100';
	});

	let sizeClasses = $derived.by(() => {
		switch (size) {
			case 'sm':
				return 'w-14 h-20 p-2 text-[8px] rounded-lg';
			case 'lg':
				return 'w-24 h-36 p-3 text-xs rounded-2xl';
			case 'md':
			default:
				return 'w-16 h-24 p-2.5 text-[9px] rounded-xl';
		}
	});
</script>

<div
	class="relative flex shrink-0 flex-col justify-between overflow-hidden shadow-2xs border-l-2 border-white/20 {genreBgClass} {sizeClasses}"
	aria-hidden="true"
>
	<!-- Spine crease overlay -->
	<div
		class="pointer-events-none absolute inset-y-0 left-0 w-1 bg-black/25"
	></div>

	<!-- Top: Monogram initials -->
	<div class="flex items-center justify-between pl-1">
		<span class="font-mono font-bold tracking-widest opacity-75">{initials}</span>
		<span class="text-[7px] font-semibold uppercase tracking-wider opacity-60">
			{genre ? genre.slice(0, 4) : 'BOOK'}
		</span>
	</div>

	<!-- Middle: Subtle decorative accent line -->
	<div class="my-auto pl-1 pr-0.5">
		<div class="h-0.5 w-4 rounded-full bg-white/25"></div>
	</div>

	<!-- Bottom: Title snippet -->
	<div class="pl-1">
		<p class="font-bold tracking-tight leading-tight line-clamp-2">
			{title}
		</p>
		{#if author && size !== 'sm'}
			<p class="mt-0.5 truncate text-[7px] opacity-70">
				{author}
			</p>
		{/if}
	</div>
</div>
