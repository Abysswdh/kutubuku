<script lang="ts">
	import './layout.css';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { data, children }: LayoutProps = $props();

	let stats = $derived(data.stats);
	let dailyGoal = $derived(data.dailyGoal);
</script>

<svelte:head>
	<title>Kutubuku — Gamified Book Journal</title>
	<meta
		name="description"
		content="A minimalist, gamified book reading journal to track daily pages, streaks, and reading habits."
	/>
</svelte:head>

<div
	class="min-h-dvh bg-zinc-50 text-zinc-900 antialiased selection:bg-accent-muted selection:text-accent-text"
>
	<!-- Responsive Navigation: Left Sidebar (Desktop), Icon Rail (Tablet/Kindle), Bottom Bar (Phone) -->
	<BottomNav currentPath={page.url.pathname} />

	<!-- Main Content Wrapper offset by sidebar width on md/lg screens -->
	<div class="md:pl-20 lg:pl-60">
		<!-- Simple Duolingo-style Top Status Bar -->
		<header class="border-b border-zinc-200/80 bg-white/90 backdrop-blur-xs sticky top-0 z-30">
			<div class="mx-auto flex max-w-xl items-center justify-between px-4 py-2.5 text-xs font-extrabold">
				<!-- Brand on mobile only (since sidebar is hidden on mobile) -->
				<a href="/" class="text-base font-black tracking-tight text-accent md:hidden">
					kutubuku
				</a>

				<div class="flex flex-1 items-center justify-end gap-5 md:justify-between">
					<!-- Streak -->
					<div class="flex items-center gap-1.5 text-reward" title="Current reading streak">
						<span class="text-sm" aria-hidden="true">🔥</span>
						<span>{stats.streakDays}</span>
					</div>

					<!-- Total XP -->
					<div class="flex items-center gap-1.5 text-accent" title="Total XP earned">
						<span class="text-sm" aria-hidden="true">⚡</span>
						<span>{stats.totalXp} XP</span>
					</div>

					<!-- Daily Pages Progress -->
					<div class="flex items-center gap-1.5 text-zinc-700" title="Today's reading goal">
						<span class="text-sm" aria-hidden="true">📖</span>
						<span>{stats.todayPagesRead}/{dailyGoal.targetPages}p</span>
					</div>
				</div>
			</div>
		</header>

		<!-- Centered Single-Column Content -->
		<main class="mx-auto w-full max-w-xl px-4 pt-5 pb-28 md:pt-8 md:pb-12">
			{@render children()}
		</main>
	</div>
</div>
