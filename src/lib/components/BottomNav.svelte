<script lang="ts">
	import { t, type Lang } from "$lib/i18n";

	interface Props {
		currentPath?: string;
		isAdmin?: boolean;
		lang?: Lang;
	}

	let { currentPath = "/", isAdmin = false, lang = "id" }: Props = $props();

	let showMore = $state(false);

	$effect(() => {
		currentPath;
		showMore = false;
	});

	let baseNavItems = $derived([
		{
			id: "journal" as const,
			label: t(lang, "Jurnal", "Journal"),
			href: "/",
			match: (path: string) =>
				path === "/" || path.startsWith("/books") || path.startsWith("/catalog"),
		},
		{
			id: "planner" as const,
			label: t(lang, "Jadwal", "Planner"),
			href: "/planner",
			match: (path: string) => path.startsWith("/planner"),
		},
		{
			id: "sobat" as const,
			label: "Sobat",
			href: "/sobat",
			match: (path: string) => path.startsWith("/sobat"),
		},
		{
			id: "profile" as const,
			label: t(lang, "Profil", "Profile"),
			href: "/profile",
			match: (path: string) => path.startsWith("/profile") || path.startsWith("/u/"),
		},
		{
			id: "settings" as const,
			label: t(lang, "Pengaturan", "Settings"),
			href: "/settings",
			match: (path: string) => path.startsWith("/settings"),
		},
	]);

	let navItems = $derived(
		isAdmin
			? [
					...baseNavItems,
					{
						id: "admin" as const,
						label: "Admin",
						href: "/admin",
						match: (path: string) => path.startsWith("/admin"),
					},
				]
			: [...baseNavItems]
	);

	let hasOverflow = $derived(navItems.length > 3);
	let mobilePrimary = $derived(hasOverflow ? navItems.slice(0, 3) : navItems);
	let mobileOverflow = $derived(hasOverflow ? navItems.slice(3) : []);
	let isOverflowActive = $derived(mobileOverflow.some((item) => item.match(currentPath)));
</script>

{#snippet navIcon(id: string, cls: string)}
	{#if id === "journal"}
		<svg class={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
			<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
		</svg>
	{:else if id === "planner"}
		<svg class={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
			<line x1="16" y1="2" x2="16" y2="6" />
			<line x1="8" y1="2" x2="8" y2="6" />
			<line x1="3" y1="10" x2="21" y2="10" />
		</svg>
	{:else if id === "sobat"}
		<svg class={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	{:else if id === "profile"}
		<svg class={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	{:else if id === "settings"}
		<svg class={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
		</svg>
	{:else if id === "admin"}
		<svg class={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
		</svg>
	{/if}
{/snippet}

<!-- Desktop Left Sidebar (lg) & Tablet Rail (md) -->
<aside
	aria-label={t(lang, "Navigasi Utama", "Main Sidebar Navigation")}
	class="fixed top-0 bottom-0 left-0 z-40 hidden flex-col border-r border-zinc-200 bg-white md:flex md:w-20 md:items-center md:py-6 lg:w-60 lg:items-stretch lg:px-4"
>
	<a
		href="/"
		class="mb-6 flex items-center justify-center rounded-xl px-2 py-1.5 focus:outline-hidden lg:justify-start lg:px-3"
		aria-label="Kutubuku"
	>
		<img src="/brand/logo-mark-teal.svg" alt="Kutubuku" class="h-8 w-8 object-contain lg:hidden" />
		<img src="/brand/logo-full-teal.svg" alt="Kutubuku" class="hidden h-8 w-auto lg:block" />
	</a>

	<nav aria-label={t(lang, "Menu Utama", "Primary")} class="flex flex-1 flex-col gap-2">
		{#each navItems as item (item.id)}
			{@const isActive = item.match(currentPath)}
			<a
				href={item.href}
				title={item.label}
				aria-label={item.label}
				aria-current={isActive ? "page" : undefined}
				class="flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-xs font-extrabold tracking-wider uppercase transition-colors lg:w-full lg:justify-start lg:gap-3.5 lg:px-4 {isActive
					? 'border-accent/30 bg-accent-subtle text-accent'
					: 'border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'}"
			>
				{@render navIcon(item.id, "h-6 w-6 shrink-0")}
				<span class="hidden lg:inline">{item.label}</span>
			</a>
		{/each}
	</nav>
</aside>

<!-- Mobile Overflow Menu Popover -->
{#if showMore && hasOverflow}
	<button
		type="button"
		aria-label={t(lang, "Tutup menu", "Close menu")}
		onclick={() => (showMore = false)}
		class="fixed inset-0 z-40 bg-black/20 md:hidden"
	></button>

	<div
		role="menu"
		class="fixed right-3 bottom-20 z-50 w-52 rounded-2xl border-2 border-zinc-200 bg-white p-2 shadow-lg md:hidden"
	>
		{#each mobileOverflow as item (item.id)}
			{@const isActive = item.match(currentPath)}
			<a
				href={item.href}
				onclick={() => (showMore = false)}
				aria-current={isActive ? "page" : undefined}
				class="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-extrabold tracking-wider uppercase transition-colors {isActive
					? 'bg-accent-subtle text-accent'
					: 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}"
			>
				{@render navIcon(item.id, "h-5 w-5 shrink-0")}
				<span>{item.label}</span>
			</a>
		{/each}
	</div>
{/if}

<!-- Mobile Bottom Bar (max 3 primary items + 4th "More / Lainnya" when >3 items) -->
<nav
	aria-label={t(lang, "Navigasi Bawah", "Mobile Bottom Navigation")}
	class="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t border-zinc-200 bg-white px-2 py-2 md:hidden"
>
	{#each mobilePrimary as item (item.id)}
		{@const isActive = item.match(currentPath)}
		<a
			href={item.href}
			aria-label={item.label}
			aria-current={isActive ? "page" : undefined}
			class="flex min-h-[48px] min-w-[56px] flex-col items-center justify-center rounded-xl border-2 px-3 py-1 transition-colors {isActive
				? 'border-accent/30 bg-accent-subtle text-accent'
				: 'border-transparent text-zinc-400 hover:text-zinc-700'}"
		>
			{@render navIcon(item.id, "h-6 w-6")}
			<span class="mt-0.5 text-[10px] font-bold">{item.label}</span>
		</a>
	{/each}

	{#if hasOverflow}
		<button
			type="button"
			onclick={() => (showMore = !showMore)}
			aria-expanded={showMore}
			aria-label={t(lang, "Lainnya", "More")}
			class="flex min-h-[48px] min-w-[56px] flex-col items-center justify-center rounded-xl border-2 px-3 py-1 transition-colors {showMore || isOverflowActive
				? 'border-accent/30 bg-accent-subtle text-accent'
				: 'border-transparent text-zinc-400 hover:text-zinc-700'}"
		>
			<svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<circle cx="5" cy="12" r="2" />
				<circle cx="12" cy="12" r="2" />
				<circle cx="19" cy="12" r="2" />
			</svg>
			<span class="mt-0.5 text-[10px] font-bold">{t(lang, "Lainnya", "More")}</span>
		</button>
	{/if}
</nav>
