<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let search = $state('');
	let addingId = $state<string | null>(null);

	let filtered = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q) return data.books;
		return data.books.filter(
			(b) =>
				b.title.toLowerCase().includes(q) ||
				b.author.toLowerCase().includes(q) ||
				b.genre.toLowerCase().includes(q) ||
				b.publisher.toLowerCase().includes(q)
		);
	});

	async function handleAddToShelf(bookId: string) {
		addingId = bookId;
		try {
			await fetch('/api/books', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ existingBookId: bookId, status: 'planned' })
			});
			await invalidateAll();
		} finally {
			addingId = null;
		}
	}
</script>

<div class="space-y-5">
	<div class="flex items-center justify-between gap-2">
		<div>
			<h1 class="text-xl font-extrabold tracking-tight text-zinc-900">Verified Catalog</h1>
			<p class="text-xs font-semibold text-zinc-400">
				Official books verified by Kutubuku moderators.
			</p>
		</div>
		<span class="rounded-lg bg-accent-subtle px-2.5 py-1 text-xs font-extrabold text-accent-text">
			{data.books.length} books
		</span>
	</div>

	<input
		type="search"
		bind:value={search}
		placeholder="Search title, author, genre, or publisher..."
		class="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 focus:border-accent focus:outline-none"
	/>

	{#if filtered.length === 0}
		<div class="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-6 text-center space-y-2">
			<p class="text-xs font-bold text-zinc-500">No verified books matched “{search}”.</p>
			{#if data.isLoggedIn}
				<a href="/" class="inline-block text-xs font-extrabold text-accent hover:underline">
					Submit a custom book from your Journal →
				</a>
			{/if}
		</div>
	{:else}
		<div class="space-y-3">
			{#each filtered as book (book.bookId)}
				<article class="flex items-center justify-between gap-3 rounded-2xl border-2 border-zinc-200 bg-white p-4">
					<div class="min-w-0 space-y-1">
						<div class="flex flex-wrap items-center gap-1.5">
							<span class="rounded-md bg-accent-subtle px-2 py-0.5 text-[10px] font-extrabold text-accent-text uppercase">
								✓ Verified
							</span>
							<span class="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
								{book.genre}
							</span>
							<span class="text-[11px] font-bold text-zinc-400">{book.pageCount} pages</span>
						</div>
						<h2 class="truncate text-sm font-extrabold text-zinc-900">{book.title}</h2>
						<p class="truncate text-xs font-semibold text-zinc-500">
							{book.author} · {book.publisher}
						</p>
					</div>

					<div class="shrink-0">
						{#if !data.isLoggedIn}
							<a
								href="/auth"
								class="rounded-xl border-2 border-zinc-200 bg-white px-3 py-2 text-xs font-extrabold text-zinc-600 hover:border-accent hover:text-accent"
							>
								Sign in
							</a>
						{:else if book.onShelf}
							<span class="inline-block rounded-xl border-2 border-accent/30 bg-accent-subtle px-3 py-2 text-xs font-extrabold text-accent">
								On Shelf ✓
							</span>
						{:else}
							<button
								type="button"
								disabled={addingId === book.bookId}
								onclick={() => handleAddToShelf(book.bookId)}
								class="rounded-xl bg-accent px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-accent-hover disabled:opacity-50"
							>
								{addingId === book.bookId ? 'Adding...' : '+ Add'}
							</button>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
