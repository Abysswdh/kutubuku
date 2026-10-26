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
	<div class="mx-auto flex w-full justify-center px-4 pt-4 sm:pt-6 xl:gap-10">
		<!-- Main Content Column: centered max-w-md, with safe bottom padding for fixed nav -->
		<main class="relative w-full max-w-md pb-36">
			{@render children()}

			<!-- Bottom navigation sits strictly inside the centered column width -->
			<BottomNav currentPath={page.url.pathname} />
		</main>

		<!-- 
			DESKTOP SIDE PANEL:
			- Visible ONLY on xl screens and up (hidden on phone, tablet, and standard laptop).
			- Displays unique content: Next Week's AI Plan Preview & Recent Activity Stream.
			- No repeated streak, daily goal, or level stats.
		-->
		<div class="sticky top-6 hidden h-fit w-80 shrink-0 xl:block">
			<SidePanel
				weeklyPlan={data.weeklyPlan}
				recentSessions={data.recentSessions}
				books={data.books}
			/>
		</div>
	</div>
</div>
