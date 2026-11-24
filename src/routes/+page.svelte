<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';
	import type { BookStatus } from '$lib/types';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import BookCard from '$lib/components/BookCard.svelte';

	let { data }: PageProps = $props();

	let stats = $derived(data.stats);
	let dailyGoal = $derived(data.dailyGoal);
	let currentlyReading = $derived(data.currentlyReading);
	let books = $derived(data.books);

	let isGoalReached = $derived(
		Boolean(stats && dailyGoal && stats.todayPagesRead >= dailyGoal.targetPages)
	);
	let pagesRemaining = $derived(
		stats && dailyGoal ? Math.max(0, dailyGoal.targetPages - stats.todayPagesRead) : 0
	);

	// Filter state
	type FilterTab = 'all' | BookStatus;
	let activeFilter = $state<FilterTab>('all');

	const filterTabs: { id: FilterTab; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'reading', label: 'Reading' },
		{ id: 'want_to_read', label: 'Planned' },
		{ id: 'paused', label: 'Paused' },
		{ id: 'completed', label: 'Finished' },
		{ id: 'dropped', label: 'Dropped' }
	];

	let filteredBooks = $derived(
		activeFilter === 'all' ? books : books.filter((b) => b.status === activeFilter)
	);

	function countFor(tab: FilterTab): number {
		if (tab === 'all') return books.length;
		return books.filter((b) => b.status === tab).length;
	}

	// Add Book form state
	let showAddForm = $state(false);
	let newTitle = $state('');
	let newAuthor = $state('');
	let newTotalPages = $state('250');
	let newGenre = $state('');
	let newStatus = $state<BookStatus>('reading');
	let isAdding = $state(false);
	let addError = $state<string | null>(null);

	async function handleAddBook(e: SubmitEvent) {
		e.preventDefault();
		if (!newTitle.trim()) return;
		isAdding = true;
		addError = null;

		try {
			const res = await fetch('/api/books', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: newTitle.trim(),
					author: newAuthor.trim() || 'Unknown Author',
					totalPages: Math.max(1, Number(newTotalPages) || 250),
					genre: newGenre.trim() || 'General',
					status: newStatus
				})
			});
			const json = await res.json();
			if (!json.ok) {
				addError = json.error ?? 'Could not add book.';
				return;
			}
			newTitle = '';
			newAuthor = '';
			newTotalPages = '250';
			newGenre = '';
			showAddForm = false;
			await invalidateAll();
		} finally {
			isAdding = false;
		}
	}
</script>

{#if data.isGuest}
	<!-- Public Guest Landing Page -->
	<div class="space-y-10 py-4">
		<section class="rounded-3xl border-2 border-zinc-200 bg-white p-7 text-center space-y-5 md:p-10">
			<div class="inline-flex items-center gap-1.5 rounded-full bg-accent-subtle px-3 py-1 text-xs font-extrabold text-accent-text">
				<span>📚</span>
				<span>Gamified Reading Journal</span>
			</div>

			<h1 class="text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">
				Finish the books sitting on your shelf.
			</h1>

			<p class="mx-auto max-w-lg text-sm font-semibold text-zinc-500">
				Kutubuku turns the physical and digital books you already own into a daily reading streak — with smart schedules, annual goals, and Sobat cheering you on.
			</p>

			<div class="flex flex-wrap items-center justify-center gap-3 pt-1">
				<a
					href="/auth"
					class="rounded-2xl bg-accent px-6 py-3 text-sm font-extrabold text-white transition hover:bg-accent-hover"
				>
					Start Reading Free →
				</a>
				<a
					href="/catalog"
					class="rounded-2xl border-2 border-zinc-200 bg-white px-5 py-3 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
				>
					Browse Verified Books
				</a>
			</div>
		</section>

		<!-- 3 Value Props -->
		<section class="grid gap-3.5 md:grid-cols-3">
			<div class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-1.5">
				<div class="text-2xl" aria-hidden="true">🔥</div>
				<h2 class="text-sm font-extrabold text-zinc-900">Daily Streaks & XP</h2>
				<p class="text-xs font-medium text-zinc-500">
					Log pages in seconds, hit your daily target, and unlock milestone badges.
				</p>
			</div>
			<div class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-1.5">
				<div class="text-2xl" aria-hidden="true">📅</div>
				<h2 class="text-sm font-extrabold text-zinc-900">Anti-Tsundoku Planner</h2>
				<p class="text-xs font-medium text-zinc-500">
					Limit concurrent books and pace your pages so every book reaches the last page.
				</p>
			</div>
			<div class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-1.5">
				<div class="text-2xl" aria-hidden="true">🎉</div>
				<h2 class="text-sm font-extrabold text-zinc-900">Sobat & Shareable Cards</h2>
				<p class="text-xs font-medium text-zinc-500">
					Follow friends, celebrate milestones, and share your public reader profile link.
				</p>
			</div>
		</section>

		<!-- Live Verified Catalog Preview -->
		{#if data.featuredBooks.length > 0}
			<section class="space-y-3.5">
				<div class="flex items-center justify-between">
					<h2 class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
						Verified Book Catalog
					</h2>
					<a href="/catalog" class="text-xs font-extrabold text-accent hover:underline">
						View all →
					</a>
				</div>
				<div class="grid gap-3 sm:grid-cols-2">
					{#each data.featuredBooks as item (item.bookId)}
						<div class="rounded-2xl border-2 border-zinc-200 bg-white p-4 space-y-1.5">
							<div class="flex items-center justify-between gap-2">
								<span class="rounded-md bg-accent-subtle px-2 py-0.5 text-[10px] font-extrabold text-accent-text uppercase">
									{item.genre}
								</span>
								<span class="text-[11px] font-bold text-zinc-400">{item.pageCount}p</span>
							</div>
							<h3 class="truncate text-sm font-extrabold text-zinc-900">{item.title}</h3>
							<p class="truncate text-xs font-semibold text-zinc-500">{item.author}</p>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</div>
{:else if stats && dailyGoal}
<div class="space-y-6">
	<!-- Header with Quick Add Book Button -->
	<div class="flex items-center justify-between gap-2">
		<h1 class="text-xl font-extrabold tracking-tight text-zinc-900">
			Reading Journal
		</h1>
		<div class="flex items-center gap-2">
			<a
				href="/catalog"
				class="rounded-xl border-2 border-zinc-200 bg-white px-3 py-2 text-xs font-extrabold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50"
			>
				Catalog
			</a>
			<button
				type="button"
				onclick={() => (showAddForm = !showAddForm)}
				class="rounded-xl border-2 px-3.5 py-2 text-xs font-extrabold transition {showAddForm
					? 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
					: 'border-accent bg-accent text-white hover:bg-accent-hover'}"
			>
				{showAddForm ? 'Close' : '+ Add Book'}
			</button>
		</div>
	</div>

	<!-- Expandable Add Book Card -->
	{#if showAddForm}
		<form
			onsubmit={handleAddBook}
			class="rounded-2xl border-2 border-accent/30 bg-white p-5 space-y-3.5"
		>
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-extrabold text-zinc-900">Add a book to your shelf</h2>
				<span class="text-[11px] font-bold text-zinc-400">Physical or digital</span>
			</div>

			{#if addError}
				<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
					{addError}
				</div>
			{/if}

			<div class="space-y-2.5">
				<input
					type="text"
					required
					bind:value={newTitle}
					placeholder="Book title *"
					class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
				/>

				<div class="grid grid-cols-2 gap-2.5">
					<input
						type="text"
						bind:value={newAuthor}
						placeholder="Author"
						class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
					/>
					<input
						type="number"
						min="1"
						required
						bind:value={newTotalPages}
						placeholder="Total pages *"
						class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-2 gap-2.5">
					<input
						type="text"
						bind:value={newGenre}
						placeholder="Genre (e.g. Science)"
						class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
					/>
					<select
						bind:value={newStatus}
						class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-800 focus:border-accent focus:bg-white focus:outline-none"
					>
						<option value="reading">Reading now</option>
						<option value="want_to_read">Planned</option>
						<option value="paused">Paused</option>
						<option value="completed">Finished</option>
					</select>
				</div>
			</div>

			<button
				type="submit"
				disabled={isAdding || !newTitle.trim()}
				class="w-full rounded-xl bg-accent py-2.5 text-xs font-extrabold tracking-wider text-white uppercase transition hover:bg-accent-hover disabled:opacity-50"
			>
				{isAdding ? 'Adding to shelf...' : 'Save Book'}
			</button>
		</form>
	{/if}

	<!-- Daily Goal Card -->
	<section
		aria-labelledby="daily-goal-heading"
		class="rounded-2xl border-2 border-zinc-200 bg-white p-5"
	>
		<div class="flex items-center justify-between gap-4">
			<div class="space-y-1">
				<h2
					id="daily-goal-heading"
					class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase"
				>
					Today's Goal
				</h2>

				<div class="flex items-baseline gap-1.5">
					<span class="text-3xl font-black text-zinc-900">
						{stats.todayPagesRead}
					</span>
					<span class="text-sm font-bold text-zinc-400">
						/ {dailyGoal.targetPages} pages
					</span>
				</div>

				<p class="text-xs font-medium text-zinc-500">
					{#if isGoalReached}
						<span class="font-bold text-reward-text">Goal reached! +20 bonus XP earned.</span>
					{:else}
						{pagesRemaining} more pages to hit today's goal.
					{/if}
				</p>
			</div>

			<div class="shrink-0">
				<ProgressRing
					value={stats.todayPagesRead}
					max={dailyGoal.targetPages}
					size={76}
					strokeWidth={7}
					isCelebratory={isGoalReached}
				/>
			</div>
		</div>

		{#if currentlyReading}
			<a
				href="/books/{currentlyReading.id}"
				class="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-xs font-extrabold tracking-wider text-white uppercase transition-colors hover:bg-accent-hover"
			>
				+ Log Reading Session · {currentlyReading.title}
			</a>
		{/if}
	</section>

	<!-- Bookshelf Section with Status Filter Pills -->
	<section aria-labelledby="books-heading" class="space-y-3.5">
		<div class="flex items-center justify-between">
			<h2 id="books-heading" class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
				Your Bookshelf ({books.length})
			</h2>
			<span class="text-[11px] font-semibold text-zinc-400">Tap a book to log, edit, or delete</span>
		</div>

		<!-- Horizontal Filter Pills -->
		<div class="flex gap-1.5 overflow-x-auto pb-1">
			{#each filterTabs as tab (tab.id)}
				{@const count = countFor(tab.id)}
				{#if tab.id === 'all' || count > 0 || activeFilter === tab.id}
					<button
						type="button"
						onclick={() => (activeFilter = tab.id)}
						class="shrink-0 rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold transition {activeFilter === tab.id
							? 'border-accent bg-accent text-white'
							: 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}"
					>
						{tab.label}
						<span class="ml-1 opacity-75">{count}</span>
					</button>
				{/if}
			{/each}
		</div>

		{#if filteredBooks.length === 0}
			<div class="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-6 text-center space-y-2.5">
				<div class="text-2xl" aria-hidden="true">📖</div>
				<p class="text-xs font-bold text-zinc-500">
					{books.length === 0
						? 'Your bookshelf is empty. Add your first book to start tracking!'
						: 'No books in this category yet.'}
				</p>
				{#if books.length === 0}
					<button
						type="button"
						onclick={() => (showAddForm = true)}
						class="rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-white hover:bg-accent-hover"
					>
						+ Add Your First Book
					</button>
				{/if}
			</div>
		{:else}
			<div class="space-y-3">
				{#each filteredBooks as book (book.id)}
					<BookCard {book} showLogButton={book.status === 'reading'} />
				{/each}
			</div>
		{/if}
	</section>
</div>
{/if}
