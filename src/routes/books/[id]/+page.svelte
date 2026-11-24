<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import BookCover from '$lib/components/BookCover.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import type { BookStatus, DropReason } from '$lib/types';
	import type { PageProps } from './$types';
	import { fade, fly } from 'svelte/transition';

	let { data }: PageProps = $props();

	let book = $derived(data.book);
	let sessions = $derived(data.sessions);

	// Log Session Form State
	let pagesRead = $state(15);
	let minutesRead = $state<number | ''>(20);
	let notes = $state('');
	let isSubmitting = $state(false);

	// Shelf Status & Drop Reason Form State (user_book table)
	let selectedStatus = $state<BookStatus>('reading');
	let selectedDropReason = $state<DropReason>('too_many_books');
	let isUpdatingStatus = $state(false);
	let statusFeedback = $state<string | null>(null);

	// Edit & Delete Book State
	let showEditForm = $state(false);
	let editTitle = $state('');
	let editAuthor = $state('');
	let editTotalPages = $state(1);
	let editCurrentPage = $state(0);
	let editGenre = $state('');
	let isSavingEdit = $state(false);
	let editError = $state<string | null>(null);
	let confirmDelete = $state(false);
	let isDeleting = $state(false);

	$effect(() => {
		selectedStatus = book.status;
		if (book.dropReason) {
			selectedDropReason = book.dropReason;
		}
		if (!showEditForm) {
			editTitle = book.title;
			editAuthor = book.author;
			editTotalPages = book.totalPages;
			editCurrentPage = book.currentPage;
			editGenre = book.genre ?? '';
		}
	});

	async function handleSaveEdit(e: SubmitEvent) {
		e.preventDefault();
		isSavingEdit = true;
		editError = null;
		try {
			const res = await fetch('/api/books', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookId: book.id,
					title: editTitle.trim(),
					author: editAuthor.trim(),
					totalPages: Number(editTotalPages),
					currentPage: Number(editCurrentPage),
					genre: editGenre.trim() || 'General'
				})
			});
			const json = await res.json();
			if (!json.ok) {
				editError = json.error ?? 'Failed to update book.';
				return;
			}
			showEditForm = false;
			await invalidateAll();
		} finally {
			isSavingEdit = false;
		}
	}

	async function handleDeleteBook() {
		isDeleting = true;
		try {
			const res = await fetch('/api/books', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bookId: book.id })
			});
			const json = await res.json();
			if (json.ok) {
				await goto('/', { invalidateAll: true });
			}
		} finally {
			isDeleting = false;
		}
	}

	// Toggle to view all vs only the 3 most recent sessions
	let showAllSessions = $state(false);
	let displayedSessions = $derived(
		showAllSessions ? sessions : sessions.slice(0, 3)
	);

	// XP Toast Feedback State
	let xpMessage = $state<{
		xp: number;
		streak: number;
		pages: number;
		isGoalMet: boolean;
	} | null>(null);

	let messageTimer: ReturnType<typeof setTimeout> | null = null;

	let progressPercent = $derived(
		book.totalPages <= 0 ? 0 : Math.round((book.currentPage / book.totalPages) * 100)
	);

	function incrementPages(delta: number) {
		pagesRead = Math.max(1, pagesRead + delta);
	}

	async function handleUpdateStatus(e: SubmitEvent) {
		e.preventDefault();
		isUpdatingStatus = true;
		statusFeedback = null;

		try {
			const res = await fetch('/api/books', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookId: book.id,
					status: selectedStatus,
					dropReason: selectedStatus === 'dropped' ? selectedDropReason : null
				})
			});
			const json = await res.json();
			if (!json.ok) {
				statusFeedback = `⚠️ ${json.error}`;
			} else {
				await invalidateAll();
				statusFeedback = `Updated shelf status to "${selectedStatus.toUpperCase()}"`;
			}
		} finally {
			isUpdatingStatus = false;
		}
	}

	async function handleSaveSession(e: SubmitEvent) {
		e.preventDefault();
		if (pagesRead < 1) return;

		isSubmitting = true;

		try {
			const res = await fetch('/api/sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookId: book.id,
					pagesRead: Number(pagesRead),
					minutesRead: minutesRead === '' ? undefined : Number(minutesRead),
					notes: notes.trim() || undefined
				})
			});
			const json = await res.json();
			if (!json.ok) return;

			const result = json.result;

			// Re-run SvelteKit load functions
			await invalidateAll();

			// Show XP gain toast with reward styling
			xpMessage = {
				xp: result.xpEarned,
				streak: result.newStreak,
				pages: result.session.pagesRead,
				isGoalMet: result.isGoalNewlyMet
			};

			notes = '';

			if (messageTimer) clearTimeout(messageTimer);
			messageTimer = setTimeout(() => {
				xpMessage = null;
			}, 4500);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-6 pb-12">
	<!-- Top Navigation / Back Button -->
	<div class="flex items-center justify-between">
		<a
			href="/"
			class="flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-xl text-xs font-semibold text-zinc-600 transition-colors hover:text-zinc-900 focus:outline-hidden"
			aria-label="Back to dashboard"
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
				<line x1="19" y1="12" x2="5" y2="12" />
				<polyline points="12 19 5 12 12 5" />
			</svg>
			<span>Dashboard</span>
		</a>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => {
					showEditForm = !showEditForm;
					confirmDelete = false;
				}}
				class="rounded-xl border-2 border-zinc-200 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
			>
				{showEditForm ? 'Cancel Edit' : '✏️ Edit'}
			</button>
		</div>
	</div>

	{#if showEditForm}
		<form
			onsubmit={handleSaveEdit}
			class="rounded-2xl border-2 border-accent/30 bg-white p-5 space-y-3.5"
		>
			<h2 class="text-sm font-extrabold text-zinc-900">Edit Book Details</h2>

			{#if editError}
				<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
					{editError}
				</div>
			{/if}

			<div class="space-y-2.5">
				<label class="block space-y-1">
					<span class="text-xs font-extrabold text-zinc-600">Title</span>
					<input
						type="text"
						required
						bind:value={editTitle}
						class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
					/>
				</label>

				<div class="grid grid-cols-2 gap-2.5">
					<label class="block space-y-1">
						<span class="text-xs font-extrabold text-zinc-600">Author</span>
						<input
							type="text"
							bind:value={editAuthor}
							class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
						/>
					</label>
					<label class="block space-y-1">
						<span class="text-xs font-extrabold text-zinc-600">Genre</span>
						<input
							type="text"
							bind:value={editGenre}
							class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
						/>
					</label>
				</div>

				<div class="grid grid-cols-2 gap-2.5">
					<label class="block space-y-1">
						<span class="text-xs font-extrabold text-zinc-600">Current Page</span>
						<input
							type="number"
							min="0"
							max={editTotalPages}
							bind:value={editCurrentPage}
							class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
						/>
					</label>
					<label class="block space-y-1">
						<span class="text-xs font-extrabold text-zinc-600">Total Pages</span>
						<input
							type="number"
							min="1"
							required
							bind:value={editTotalPages}
							class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-accent focus:bg-white focus:outline-none"
						/>
					</label>
				</div>
			</div>

			<div class="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100">
				{#if !confirmDelete}
					<button
						type="button"
						onclick={() => (confirmDelete = true)}
						class="rounded-xl border-2 border-red-200 bg-red-50 px-3.5 py-2 text-xs font-extrabold text-red-600 hover:bg-red-100"
					>
						Remove from Shelf
					</button>
				{:else}
					<div class="flex items-center gap-1.5">
						<button
							type="button"
							disabled={isDeleting}
							onclick={handleDeleteBook}
							class="rounded-xl bg-red-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-red-700 disabled:opacity-50"
						>
							{isDeleting ? 'Removing...' : 'Confirm Remove'}
						</button>
						<button
							type="button"
							onclick={() => (confirmDelete = false)}
							class="rounded-xl border border-zinc-200 px-2.5 py-2 text-xs font-bold text-zinc-500"
						>
							Cancel
						</button>
					</div>
				{/if}

				<button
					type="submit"
					disabled={isSavingEdit}
					class="rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-white hover:bg-accent-hover disabled:opacity-50"
				>
					{isSavingEdit ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</form>
	{/if}

	<!-- Book Header Card with Generated Genre-Based Cover -->
	<header
		class="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs"
		aria-labelledby="book-title"
	>
		<div class="flex items-start gap-4">
			<!-- Generated Book Cover -->
			<BookCover
				title={book.title}
				author={book.author}
				genre={book.genre}
				size="md"
			/>

			<!-- Title, Author, Publisher, Progress -->
			<div class="flex min-w-0 flex-1 flex-col justify-between self-stretch">
				<div>
					<span class="text-xs font-bold text-zinc-400 uppercase tracking-wider">
						{book.genre || 'Reading'} {book.userBookId ? `• ${book.userBookId}` : ''}
					</span>
					<h1 id="book-title" class="mt-0.5 text-lg font-black tracking-tight text-zinc-900 truncate">
						{book.title}
					</h1>
					<p class="text-xs text-zinc-500 truncate">
						{book.author}
						{#if book.publisher}
							• {book.publisher}
						{/if}
					</p>
				</div>

				<div class="mt-4">
					<ProgressBar
						value={book.currentPage}
						max={book.totalPages}
						sublabel="Page {book.currentPage} of {book.totalPages} ({progressPercent}%)"
						showPercentage={true}
						heightClass="h-2"
					/>
				</div>
			</div>
		</div>

		<!-- Shelf Status & Drop Reason Control (user_book table) -->
		<form onsubmit={handleUpdateStatus} class="mt-4 border-t border-zinc-100 pt-3.5 text-xs space-y-2.5">
			<div class="flex flex-wrap items-center gap-2">
				<label for="shelf-status" class="font-bold text-zinc-600">Shelf Status:</label>
				<select
					id="shelf-status"
					bind:value={selectedStatus}
					class="h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-800"
				>
					<option value="reading">Reading</option>
					<option value="want_to_read">Planned (Want to Read)</option>
					<option value="paused">Paused</option>
					<option value="completed">Finished</option>
					<option value="dropped">Dropped</option>
				</select>

				{#if selectedStatus === 'dropped'}
					<select
						aria-label="Reason for dropping book"
						bind:value={selectedDropReason}
						class="h-9 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700"
					>
						<option value="too_many_books">Reason: Too Many Books</option>
						<option value="overwhelmed">Reason: Overwhelmed</option>
						<option value="lost_interest">Reason: Lost Interest</option>
						<option value="other">Reason: Other</option>
					</select>
				{/if}

				<button
					type="submit"
					disabled={isUpdatingStatus}
					class="h-9 rounded-xl border border-zinc-200 bg-white px-3.5 font-extrabold text-zinc-700 transition-colors hover:bg-zinc-50"
				>
					{isUpdatingStatus ? 'Saving...' : 'Update Status'}
				</button>
			</div>

			{#if statusFeedback}
				<p class="text-[11px] font-bold text-accent">{statusFeedback}</p>
			{/if}
		</form>
	</header>

	<!-- Reward XP Notification Toast (Appears upon saving) -->
	{#if xpMessage}
		<div
			in:fly={{ y: -8, duration: 250 }}
			out:fade={{ duration: 150 }}
			role="status"
			aria-live="polite"
			class="flex items-center justify-between rounded-2xl border border-reward-muted bg-reward-subtle px-4 py-3 text-reward shadow-xs"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-xl bg-reward text-white shadow-2xs"
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
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</div>
				<div>
					<p class="text-xs font-black text-reward-text">
						+{xpMessage.xp} XP Earned!
					</p>
					<p class="text-[11px] text-zinc-600">
						Logged {xpMessage.pages} pages • Streak maintained at {xpMessage.streak} days
						{#if xpMessage.isGoalMet}
							<span class="font-bold text-reward-text">• Daily goal completed!</span>
						{/if}
					</p>
				</div>
			</div>

			<button
				type="button"
				onclick={() => (xpMessage = null)}
				class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-reward-text hover:opacity-70"
				aria-label="Dismiss notification"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>
	{/if}

	<!-- Log Session Form -->
	<section
		aria-labelledby="log-form-title"
		class="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs"
	>
		<div class="mb-5">
			<h2 id="log-form-title" class="text-base font-bold tracking-tight text-zinc-900">
				Log Reading Session
			</h2>
			<p class="text-xs text-zinc-500 mt-0.5">
				Track pages read today (`currentPage = startPage + pagesRead`) to gain XP and maintain your streak.
			</p>
		</div>

		<form onsubmit={handleSaveSession} class="space-y-5">
			<!-- Stepper: Pages Read -->
			<div>
				<label for="pages-read" class="block text-xs font-bold text-zinc-700">
					Pages Read
				</label>

				<div class="mt-2 flex items-center gap-2">
					<!-- Decrement Button (>= 44px) -->
					<button
						type="button"
						onclick={() => incrementPages(-1)}
						disabled={pagesRead <= 1}
						class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-base font-bold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40"
						aria-label="Decrease pages read by 1"
					>
						−
					</button>

					<!-- Number Input -->
					<div class="relative flex-1">
						<input
							id="pages-read"
							type="number"
							min="1"
							max={book.totalPages - book.currentPage || 500}
							bind:value={pagesRead}
							required
							class="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-center text-lg font-bold text-zinc-900 focus:border-accent focus:outline-hidden"
						/>
					</div>

					<!-- Increment Button (>= 44px) -->
					<button
						type="button"
						onclick={() => incrementPages(1)}
						class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-base font-bold text-zinc-700 transition-colors hover:bg-zinc-100"
						aria-label="Increase pages read by 1"
					>
						+
					</button>
				</div>

				<!-- Quick Presets -->
				<div class="mt-2.5 flex items-center gap-2">
					<span class="text-xs text-zinc-400">Quick add:</span>
					{#each [5, 10, 20] as preset}
						<button
							type="button"
							onclick={() => incrementPages(preset)}
							class="flex min-h-[36px] items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
						>
							+{preset}
						</button>
					{/each}
				</div>
			</div>

			<!-- Optional Minutes Read -->
			<div>
				<label for="minutes-read" class="block text-xs font-bold text-zinc-700">
					Minutes Spent <span class="font-normal text-zinc-400">(optional)</span>
				</label>
				<input
					id="minutes-read"
					type="number"
					min="1"
					placeholder="e.g. 25"
					bind:value={minutesRead}
					class="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent focus:outline-hidden"
				/>
			</div>

			<!-- Optional Short Note -->
			<div>
				<label for="session-notes" class="block text-xs font-bold text-zinc-700">
					Notes & Takeaways <span class="font-normal text-zinc-400">(optional)</span>
				</label>
				<textarea
					id="session-notes"
					rows="2"
					placeholder="What stood out or what quote resonated?"
					bind:value={notes}
					class="mt-1.5 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-accent focus:outline-hidden"
				></textarea>
			</div>

			<!-- Clearly Dominant Save Action Button -->
			<button
				type="submit"
				disabled={isSubmitting}
				class="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-accent-hover active:bg-accent-text disabled:opacity-50"
			>
				{#if isSubmitting}
					<span class="text-xs">Saving session...</span>
				{:else}
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
						<polyline points="20 6 9 17 4 12" />
					</svg>
					Save Session
				{/if}
			</button>
		</form>
	</section>

	<!-- Recent Sessions for this Book: Only 3 most recent shown with "View all" link -->
	<section aria-labelledby="history-heading" class="space-y-3">
		<div class="flex items-center justify-between px-1">
			<h2 id="history-heading" class="text-xs font-bold tracking-wider text-zinc-700 uppercase">
				Recent Sessions ({sessions.length})
			</h2>

			{#if sessions.length > 3}
				<button
					type="button"
					onclick={() => (showAllSessions = !showAllSessions)}
					class="text-xs font-semibold text-accent hover:underline"
				>
					{showAllSessions ? 'Show 3 recent' : `View all (${sessions.length})`}
				</button>
			{/if}
		</div>

		{#if sessions.length === 0}
			<div
				class="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center text-xs text-zinc-500"
			>
				No reading sessions recorded for this book yet.
			</div>
		{:else}
			<ul class="space-y-2.5" role="list">
				{#each displayedSessions as session (session.id)}
					<li class="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="text-sm font-bold text-zinc-900">
									+{session.pagesRead} pages
								</span>
								{#if session.startPage !== undefined && session.currentPage !== undefined}
									<span class="text-xs font-semibold text-zinc-400">
										(p. {session.startPage} → {session.currentPage})
									</span>
								{/if}
								{#if session.minutesRead}
									<span class="text-xs text-zinc-400">· {session.minutesRead} min</span>
								{/if}
							</div>

							<div class="flex items-center gap-2">
								<span
									class="rounded-md bg-reward-subtle px-2 py-0.5 text-[10px] font-bold text-reward border border-reward-muted"
								>
									+{session.xpEarned} XP
								</span>
								<time
									datetime={session.loggedAt}
									class="text-xs font-medium text-zinc-400"
								>
									{session.loggedAt}
								</time>
							</div>
						</div>

						{#if session.notes}
							<p class="mt-2 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 pt-2">
								“{session.notes}”
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
