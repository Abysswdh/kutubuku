<script lang="ts">
	import type { Book } from '$lib/types';
	import ProgressBar from './ProgressBar.svelte';

	interface Props {
		book: Book;
		showLogButton?: boolean;
	}

	let { book, showLogButton = true }: Props = $props();

	let progressPercent = $derived(
		book.totalPages <= 0 ? 0 : Math.round((book.currentPage / book.totalPages) * 100)
	);
</script>

<article
	class="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs transition-colors"
>
	<div class="flex items-start gap-3.5">
		<!-- Cover Placeholder -->
		<div
			class="relative flex h-20 w-14 shrink-0 flex-col items-center justify-between rounded-lg p-1.5 text-white shadow-2xs"
			style="background-color: {book.coverColor || 'var(--color-accent)'};"
			aria-hidden="true"
		>
			<span class="text-[9px] font-bold tracking-wider uppercase opacity-80">Book</span>
			<svg
				class="h-6 w-6 opacity-90"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
				<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
			</svg>
			<span class="text-[8px] font-medium opacity-80 truncate max-w-full">
				{book.totalPages}p
			</span>
		</div>

		<!-- Book Details -->
		<div class="flex min-w-0 flex-1 flex-col">
			<div class="flex items-center justify-between gap-2">
				<span
					class="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
				>
					{book.genre || 'Currently Reading'}
				</span>
				<span class="text-xs font-semibold text-zinc-900">{progressPercent}%</span>
			</div>

			<h3 class="mt-1 truncate text-base font-bold text-zinc-900">
				<a href="/books/{book.id}" class="hover:underline focus:outline-hidden">
					{book.title}
				</a>
			</h3>
			<p class="truncate text-xs text-zinc-500">{book.author}</p>

			<div class="mt-2.5">
				<ProgressBar
					value={book.currentPage}
					max={book.totalPages}
					sublabel="Page {book.currentPage} of {book.totalPages}"
					heightClass="h-1.5"
				/>
			</div>
		</div>
	</div>

	{#if showLogButton}
		<div class="mt-4 border-t border-zinc-100 pt-3">
			<a
				href="/books/{book.id}"
				class="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover active:bg-accent-text"
				aria-label="Log reading session for {book.title}"
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
				Log session
			</a>
		</div>
	{/if}
</article>
