<script lang="ts">
	import './layout.css';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import SidePanel from '$lib/components/SidePanel.svelte';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<title>Kutubuku — Gamified Book Journal</title>
	<meta
		name="description"
		content="A minimalist, gamified book reading journal to track daily pages, streaks, and reading habits."
	/>
</svelte:head>

<!-- Mobile-first wrapper with vertical scroll and min-h-dvh -->
<div
	class="min-h-dvh bg-zinc-50 text-zinc-900 antialiased selection:bg-accent-muted selection:text-accent-text"
>
	<!-- Duolingo-style centered layout: centered column on all devices -->
	<div class="mx-auto flex w-full justify-center px-4 pt-4 sm:pt-6 lg:gap-8">
		<!-- Main Content Column (Max width constrained, never stretches full laptop screen) -->
		<main class="relative w-full max-w-md pb-28">
			{@render children()}

			<!-- Bottom navigation sits strictly inside the centered column width -->
			<BottomNav currentPath={page.url.pathname} />
		</main>

		<!-- 
			OPTIONAL: Desktop companion panel on lg screens.
			To remove: simply delete or comment out this <aside> block.
			The main column remains perfectly centered with max-w-md.
		-->
		<div class="sticky top-6 hidden h-fit w-72 shrink-0 lg:block">
			<SidePanel stats={data.stats} dailyGoal={data.dailyGoal} />
		</div>
	</div>
</div>
