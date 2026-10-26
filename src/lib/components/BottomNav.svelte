<script lang="ts">
	interface Props {
		currentPath?: string;
	}

	let { currentPath = '/' }: Props = $props();
</script>

<nav
	aria-label="Main Navigation"
	class="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md px-4 pb-3 pointer-events-none"
>
	<div
		class="pointer-events-auto flex items-center justify-around rounded-2xl border border-zinc-200/90 bg-white/95 px-2 py-1.5 shadow-xs backdrop-blur-md"
	>
		<!-- Home -->
		<a
			href="/"
			class="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center rounded-xl text-xs font-medium transition-colors {currentPath ===
			'/'
				? 'text-accent font-semibold'
				: 'text-zinc-500 hover:text-zinc-900'}"
			aria-current={currentPath === '/' ? 'page' : undefined}
		>
			<svg
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
				<polyline points="9 22 9 12 15 12 15 22" />
			</svg>
			<span class="mt-0.5 text-[10px]">Home</span>
		</a>

		<!-- Books -->
		<a
			href="/books/book-1"
			class="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center rounded-xl text-xs font-medium transition-colors {currentPath.startsWith(
				'/books'
			)
				? 'text-accent font-semibold'
				: 'text-zinc-500 hover:text-zinc-900'}"
			aria-current={currentPath.startsWith('/books') ? 'page' : undefined}
		>
			<svg
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
				<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
			</svg>
			<span class="mt-0.5 text-[10px]">Books</span>
		</a>

		<!-- Log Quick Action -->
		<a
			href="/books/book-1"
			class="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center rounded-xl text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
			aria-label="Log reading session"
		>
			<div
				class="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow-2xs"
			>
				<svg
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M12 5v14M5 12h14" />
				</svg>
			</div>
			<span class="mt-0.5 text-[10px]">Log</span>
		</a>

		<!-- Profile / Overview -->
		<a
			href="/"
			class="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center rounded-xl text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
			aria-label="Profile and user stats"
		>
			<svg
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
			<span class="mt-0.5 text-[10px]">Profile</span>
		</a>
	</div>
</nav>
