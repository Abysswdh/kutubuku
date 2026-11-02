<script lang="ts">
	interface Props {
		currentPath?: string;
	}

	let { currentPath = "/" }: Props = $props();

	const navItems = [
		{
			id: "journal",
			label: "Journal",
			href: "/",
			match: (path: string) => path === "/" || path.startsWith("/books"),
		},
		{
			id: "planner",
			label: "Planner",
			href: "/planner",
			match: (path: string) => path.startsWith("/planner"),
		},
		{
			id: "bros",
			label: "Bros",
			href: "/bros",
			match: (path: string) => path.startsWith("/bros"),
		},
		{
			id: "profile",
			label: "Profile",
			href: "/profile",
			match: (path: string) => path.startsWith("/profile"),
		},
	] as const;
</script>

<!-- 
	1. DESKTOP LEFT SIDEBAR (lg and up):
	   Full left sidebar with brand text + icon & uppercase label (Duolingo desktop style)
	2. TABLET / KINDLE LEFT RAIL (md to lg):
	   Narrow icon-only left rail (Duolingo tablet/compact style)
-->
<aside
	aria-label="Main Sidebar Navigation"
	class="fixed top-0 bottom-0 left-0 z-40 hidden flex-col border-r border-zinc-200 bg-white md:flex md:w-20 md:items-center md:py-6 lg:w-60 lg:items-stretch lg:px-4"
>
	<!-- Brand Header -->
	<a
		href="/"
		class="mb-6 flex items-center justify-center rounded-xl px-2 py-1.5 text-accent focus:outline-hidden lg:justify-start lg:px-3"
		aria-label="Kutubuku Home"
	>
		<!-- Icon shown on tablet/Kindle rail (and alongside text on desktop) -->
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-2xs lg:mr-2.5 lg:h-8 lg:w-8"
		>
			<svg
				class="h-5 w-5 lg:h-4 lg:w-4"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
				<path
					d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
				/>
			</svg>
		</div>
		<span
			class="hidden text-2xl font-black tracking-tight text-accent lg:inline"
		>
			kutubuku
		</span>
	</a>

	<!-- Nav Links -->
	<nav aria-label="Primary" class="flex flex-1 flex-col gap-2">
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
				{#if item.id === "journal"}
					<svg
						class="h-6 w-6 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
						<path
							d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
						/>
					</svg>
				{:else if item.id === "planner"}
					<svg
						class="h-6 w-6 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<rect
							x="3"
							y="4"
							width="18"
							height="18"
							rx="2"
							ry="2"
						/>
						<line x1="16" y1="2" x2="16" y2="6" />
						<line x1="8" y1="2" x2="8" y2="6" />
						<line x1="3" y1="10" x2="21" y2="10" />
					</svg>
				{:else if item.id === "bros"}
					<svg
						class="h-6 w-6 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
						<path d="M16 3.13a4 4 0 0 1 0 7.75" />
					</svg>
				{:else if item.id === "profile"}
					<svg
						class="h-6 w-6 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
				{/if}

				<span class="hidden lg:inline">{item.label}</span>
			</a>
		{/each}
	</nav>
</aside>

<!-- 
	3. MOBILE BOTTOM BAR (below md):
	   Full-width bottom navigation bar with icons (Duolingo phone style)
-->
<nav
	aria-label="Mobile Bottom Navigation"
	class="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t border-zinc-200 bg-white px-2 py-2 md:hidden"
>
	{#each navItems as item (item.id)}
		{@const isActive = item.match(currentPath)}
		<a
			href={item.href}
			aria-label={item.label}
			aria-current={isActive ? "page" : undefined}
			class="flex min-h-[48px] min-w-[56px] flex-col items-center justify-center rounded-xl border-2 px-3 py-1 transition-colors {isActive
				? 'border-accent/30 bg-accent-subtle text-accent'
				: 'border-transparent text-zinc-400 hover:text-zinc-700'}"
		>
			{#if item.id === "journal"}
				<svg
					class="h-6 w-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
					<path
						d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
					/>
				</svg>
			{:else if item.id === "planner"}
				<svg
					class="h-6 w-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
					<line x1="16" y1="2" x2="16" y2="6" />
					<line x1="8" y1="2" x2="8" y2="6" />
					<line x1="3" y1="10" x2="21" y2="10" />
				</svg>
			{:else if item.id === "bros"}
				<svg
					class="h-6 w-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
			{:else if item.id === "profile"}
				<svg
					class="h-6 w-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			{/if}
			<span class="mt-0.5 text-[10px] font-bold">{item.label}</span>
		</a>
	{/each}
</nav>
