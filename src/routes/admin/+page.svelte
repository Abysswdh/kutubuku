<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { CatalogBook, VerificationStatus } from '$lib/server/catalog';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let activeTab = $state<'queue' | 'add' | 'all'>('queue');
	let busyId = $state<string | null>(null);
	let feedback = $state<string | null>(null);
	let errorMsg = $state<string | null>(null);

	let pendingBooks = $derived(data.books.filter((b) => b.verificationStatus === 'pending'));

	// Inline edit state for moderation
	let editingBookId = $state<string | null>(null);
	let editTitle = $state('');
	let editAuthor = $state('');
	let editPublisher = $state('');
	let editGenre = $state('');
	let editIsbn = $state('');
	let editPages = $state(250);

	// Official book creation state
	let newTitle = $state('');
	let newAuthor = $state('');
	let newPublisher = $state('');
	let newGenre = $state('');
	let newIsbn = $state('');
	let newPages = $state('300');
	let isCreating = $state(false);

	function startEdit(book: CatalogBook) {
		editingBookId = book.bookId;
		editTitle = book.title;
		editAuthor = book.author;
		editPublisher = book.publisher;
		editGenre = book.genre;
		editIsbn = book.isbn13 ?? '';
		editPages = book.pageCount;
	}

	async function moderate(bookId: string, status: VerificationStatus, withEdits = false) {
		busyId = bookId;
		feedback = null;
		errorMsg = null;
		try {
			const payload = withEdits
				? {
						bookId,
						verificationStatus: status,
						title: editTitle,
						author: editAuthor,
						publisher: editPublisher,
						genre: editGenre,
						isbn13: editIsbn,
						pageCount: Number(editPages)
					}
				: { bookId, verificationStatus: status };

			const res = await fetch('/api/admin/books', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const json = await res.json();
			if (!json.ok) {
				errorMsg = json.error ?? 'Moderation failed.';
				return;
			}
			editingBookId = null;
			feedback = `Book ${bookId} marked as ${status.toUpperCase()}.`;
			await invalidateAll();
		} finally {
			busyId = null;
		}
	}

	async function handleCreateOfficial(e: SubmitEvent) {
		e.preventDefault();
		isCreating = true;
		feedback = null;
		errorMsg = null;
		try {
			const res = await fetch('/api/admin/books', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: newTitle,
					author: newAuthor,
					publisher: newPublisher,
					genre: newGenre,
					isbn13: newIsbn,
					pageCount: Number(newPages)
				})
			});
			const json = await res.json();
			if (!json.ok) {
				errorMsg = json.error ?? 'Failed to add official book.';
				return;
			}
			newTitle = '';
			newAuthor = '';
			newPublisher = '';
			newGenre = '';
			newIsbn = '';
			newPages = '300';
			feedback = `Added verified book ${json.bookId} to Master Catalog!`;
			await invalidateAll();
		} finally {
			isCreating = false;
		}
	}
</script>

<div class="space-y-5">
	<div class="flex items-center justify-between">
		<div>
			<span class="rounded-md bg-reward-subtle px-2 py-0.5 text-[10px] font-extrabold text-reward-text uppercase">
				Admin Moderator
			</span>
			<h1 class="mt-1 text-xl font-extrabold tracking-tight text-zinc-900">
				Book Catalog Control
			</h1>
		</div>
	</div>

	<!-- Platform Stats -->
	<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
		<div class="rounded-2xl border-2 border-zinc-200 bg-white p-3.5 text-center">
			<div class="text-lg font-black text-reward">{data.stats.pendingBooks}</div>
			<div class="text-[10px] font-bold text-zinc-400 uppercase">Pending</div>
		</div>
		<div class="rounded-2xl border-2 border-zinc-200 bg-white p-3.5 text-center">
			<div class="text-lg font-black text-accent">{data.stats.verifiedBooks}</div>
			<div class="text-[10px] font-bold text-zinc-400 uppercase">Verified</div>
		</div>
		<div class="rounded-2xl border-2 border-zinc-200 bg-white p-3.5 text-center">
			<div class="text-lg font-black text-zinc-900">{data.stats.totalUsers}</div>
			<div class="text-[10px] font-bold text-zinc-400 uppercase">Readers</div>
		</div>
		<div class="rounded-2xl border-2 border-zinc-200 bg-white p-3.5 text-center">
			<div class="text-lg font-black text-zinc-900">{data.stats.totalPagesLogged}</div>
			<div class="text-[10px] font-bold text-zinc-400 uppercase">Pages Logged</div>
		</div>
	</div>

	{#if feedback}
		<div class="rounded-xl border border-accent/30 bg-accent-subtle px-3.5 py-2.5 text-xs font-bold text-accent-text">
			✓ {feedback}
		</div>
	{/if}
	{#if errorMsg}
		<div class="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700">
			⚠️ {errorMsg}
		</div>
	{/if}

	<!-- 3-Tab Switcher -->
	<div class="grid grid-cols-3 gap-1.5 rounded-2xl border-2 border-zinc-200 bg-white p-1.5 text-xs font-extrabold">
		<button
			type="button"
			onclick={() => (activeTab = 'queue')}
			class="rounded-xl py-2 transition {activeTab === 'queue'
				? 'bg-accent text-white'
				: 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}"
		>
			Queue ({pendingBooks.length})
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'add')}
			class="rounded-xl py-2 transition {activeTab === 'add'
				? 'bg-accent text-white'
				: 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}"
		>
			+ Official Book
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'all')}
			class="rounded-xl py-2 transition {activeTab === 'all'
				? 'bg-accent text-white'
				: 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}"
		>
			All ({data.books.length})
		</button>
	</div>

	{#if activeTab === 'queue'}
		{#if pendingBooks.length === 0}
			<div class="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-6 text-center space-y-1.5">
				<div class="text-2xl" aria-hidden="true">✅</div>
				<p class="text-sm font-extrabold text-zinc-800">Moderation queue is clear!</p>
				<p class="text-xs font-medium text-zinc-400">
					User-submitted books will appear here for you to verify or edit.
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each pendingBooks as book (book.bookId)}
					<article class="rounded-2xl border-2 border-reward-muted bg-white p-4 space-y-3">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<span class="rounded-md bg-reward-subtle px-2 py-0.5 text-[10px] font-extrabold text-reward-text uppercase">
									Pending · {book.bookId}
								</span>
								<h2 class="mt-1 text-sm font-extrabold text-zinc-900">{book.title}</h2>
								<p class="text-xs font-semibold text-zinc-500">
									{book.author} · {book.publisher} · {book.genre} · {book.pageCount}p
								</p>
							</div>
							<button
								type="button"
								onclick={() => (editingBookId === book.bookId ? (editingBookId = null) : startEdit(book))}
								class="shrink-0 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
							>
								{editingBookId === book.bookId ? 'Close' : 'Edit'}
							</button>
						</div>

						{#if editingBookId === book.bookId}
							<div class="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3">
								<input
									type="text"
									bind:value={editTitle}
									placeholder="Title"
									class="col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold"
								/>
								<input
									type="text"
									bind:value={editAuthor}
									placeholder="Author"
									class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold"
								/>
								<input
									type="text"
									bind:value={editPublisher}
									placeholder="Publisher"
									class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold"
								/>
								<input
									type="text"
									bind:value={editGenre}
									placeholder="Genre"
									class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold"
								/>
								<input
									type="number"
									min="1"
									bind:value={editPages}
									placeholder="Pages"
									class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold"
								/>
								<input
									type="text"
									bind:value={editIsbn}
									placeholder="ISBN-13 (13 digits, optional)"
									class="col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold"
								/>
							</div>
						{/if}

						<div class="flex items-center gap-2 pt-1">
							<button
								type="button"
								disabled={busyId === book.bookId}
								onclick={() => moderate(book.bookId, 'verified', editingBookId === book.bookId)}
								class="flex-1 rounded-xl bg-accent py-2 text-xs font-extrabold text-white hover:bg-accent-hover disabled:opacity-50"
							>
								✓ Approve & Verify
							</button>
							<button
								type="button"
								disabled={busyId === book.bookId}
								onclick={() => moderate(book.bookId, 'rejected')}
								class="rounded-xl border-2 border-red-200 bg-red-50 px-3.5 py-2 text-xs font-extrabold text-red-600 hover:bg-red-100 disabled:opacity-50"
							>
								Reject
							</button>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	{:else if activeTab === 'add'}
		<form
			onsubmit={handleCreateOfficial}
			class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-3.5"
		>
			<h2 class="text-sm font-extrabold text-zinc-900">Add Official Verified Book</h2>
			<p class="text-xs font-medium text-zinc-400">
				Creates normalized rows in book, author, publisher, and genre with Verified status.
			</p>

			<div class="space-y-2.5">
				<input
					type="text"
					required
					bind:value={newTitle}
					placeholder="Book title *"
					class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-semibold focus:border-accent focus:bg-white focus:outline-none"
				/>
				<div class="grid grid-cols-2 gap-2.5">
					<input
						type="text"
						required
						bind:value={newAuthor}
						placeholder="Author *"
						class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none"
					/>
					<input
						type="text"
						required
						bind:value={newPublisher}
						placeholder="Publisher *"
						class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none"
					/>
				</div>
				<div class="grid grid-cols-2 gap-2.5">
					<input
						type="text"
						required
						bind:value={newGenre}
						placeholder="Genre *"
						class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none"
					/>
					<input
						type="number"
						min="1"
						required
						bind:value={newPages}
						placeholder="Page count *"
						class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none"
					/>
				</div>
				<input
					type="text"
					bind:value={newIsbn}
					placeholder="ISBN-13 (13 digits, optional)"
					class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				disabled={isCreating}
				class="w-full rounded-xl bg-accent py-2.5 text-xs font-extrabold tracking-wider text-white uppercase hover:bg-accent-hover disabled:opacity-50"
			>
				{isCreating ? 'Adding book...' : '+ Publish Verified Book'}
			</button>
		</form>
	{:else}
		<div class="space-y-2.5">
			{#each data.books as book (book.bookId)}
				<div class="flex items-center justify-between gap-3 rounded-2xl border-2 border-zinc-200 bg-white p-3.5">
					<div class="min-w-0">
						<div class="flex items-center gap-1.5">
							<span
								class="rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase {book.verificationStatus === 'verified'
									? 'bg-accent-subtle text-accent-text'
									: book.verificationStatus === 'pending'
										? 'bg-reward-subtle text-reward-text'
										: 'bg-red-50 text-red-600'}"
							>
								{book.verificationStatus}
							</span>
							<span class="text-[11px] font-bold text-zinc-400">{book.bookId} · {book.pageCount}p</span>
						</div>
						<div class="mt-0.5 truncate text-sm font-extrabold text-zinc-900">{book.title}</div>
						<div class="truncate text-xs font-semibold text-zinc-500">
							{book.author} · {book.publisher}
						</div>
					</div>

					<div class="shrink-0">
						{#if book.verificationStatus !== 'verified'}
							<button
								type="button"
								disabled={busyId === book.bookId}
								onclick={() => moderate(book.bookId, 'verified')}
								class="rounded-xl bg-accent px-3 py-1.5 text-xs font-extrabold text-white hover:bg-accent-hover disabled:opacity-50"
							>
								Verify
							</button>
						{:else}
							<button
								type="button"
								disabled={busyId === book.bookId}
								onclick={() => moderate(book.bookId, 'pending')}
								class="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
							>
								Unverify
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
