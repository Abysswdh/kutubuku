<script lang="ts">
	import type { Book } from '$lib/types';
	import BookCover from './BookCover.svelte';
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
	<div class="flex items-start gap-4">
		<!-- Generated Genre-Based Book Cover -->
		<BookCover
			title={book.title}
			author={book.author}
			genre={book.genre}
			size="sm"
		/>

		<!-- Book Details -->
		<div class="flex min-w-0 flex-1 flex-col">
			<div class="flex items-center justify-between gap-2">
				<span class="text-xs font-semibold text-zinc-500">
					{book.genre || 'Reading'}
				</span>
				<span class="text-xs font-bold text-zinc-900">{progressPercent}%</span>
			</div>

			<h3 class="mt-0.5 truncate text-base font-bold text-zinc-900">
				<a href="/books/{book.id}" class="hover:underline focus:outline-hidden">
					{book.title}
				</a>
			</h3>
			<p class="truncate text-xs text-zinc-500">{book.author}</p>

			<div class="mt-3">
				<ProgressBar
					value={book.currentPage}
					max={book.totalPages}
					sublabel="Page {book.currentPage} of {book.totalPages}"
					heightClass="h-2"
				/>
			</div>
		</div>
	</div>

	{#if showLogButton}
		<div class="mt-4 border-t border-zinc-100 pt-3">
			<a
				href="/books/{book.id}"
				class="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
				aria-label="View book details and log session for {book.title}"
			>
				Continue reading
			</a>
		</div>
	{/if}
</article>
