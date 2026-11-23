<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';
	import StreakWeek from '$lib/components/StreakWeek.svelte';

	let { data }: PageProps = $props();

	let weekDays = $derived(data.weekDays);
	let weeklyPlan = $derived(data.weeklyPlan);
	let scheduleDays = $derived(data.scheduleDays);
	let stats = $derived(data.stats);
	let activeReadingCount = $derived(
		data.books.filter((b) => b.status === 'reading').length
	);
	let maxConcurrent = $derived(stats.maxConcurrentBooks ?? 3);
	let shelfQueue = $derived(
		data.books.filter((b) => b.status !== 'completed')
	);

	// Interactive Schedule Generator + BYOK Gemini State
	let showScheduleGenerator = $state(false);
	let selectedBookId = $state('book-1');
	let customDailyPages = $state(28);
	let geminiKey = $state(
		typeof window !== 'undefined' ? localStorage.getItem('kutubuku_gemini_key') ?? '' : ''
	);
	let isGeneratingSchedule = $state(false);
	let scheduleToast = $state<string | null>(null);

	// Interactive Add Book Modal State
	let showAddBook = $state(false);
	let newTitle = $state('');
	let newAuthor = $state('');
	let newPublisher = $state('');
	let newIsbn13 = $state('');
	let newGenre = $state('Self-Improvement');
	let newTotalPages = $state(250);
	let newStatus = $state<'reading' | 'want_to_read'>('want_to_read');
	let isAddingBook = $state(false);

	const dropReasonLabels: Record<string, string> = {
		too_many_books: 'Dropped: Too Many Books',
		overwhelmed: 'Dropped: Overwhelmed',
		lost_interest: 'Dropped: Lost Interest',
		other: 'Dropped'
	};

	async function handleGenerateSchedule(e: SubmitEvent) {
		e.preventDefault();
		isGeneratingSchedule = true;
		scheduleToast = null;

		try {
			if (typeof window !== 'undefined') {
				if (geminiKey.trim()) {
					localStorage.setItem('kutubuku_gemini_key', geminiKey.trim());
				} else {
					localStorage.removeItem('kutubuku_gemini_key');
				}
			}

			const targetBook = data.books.find((b) => b.id === selectedBookId) ?? data.books[0];
			const remainingPages = targetBook
				? Math.max(10, targetBook.totalPages - targetBook.currentPage)
				: 150;

			const res = await fetch('/api/schedule', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookId: selectedBookId,
					targetPagesPerDay: Number(customDailyPages),
					geminiApiKey: geminiKey.trim() || undefined,
					bookTitle: targetBook?.title,
					remainingPages
				})
			});
			const json = await res.json();
			if (json.ok) {
				await invalidateAll();
				showScheduleGenerator = false;
				scheduleToast = json.usedAi
					? '✨ Generated smart weekly schedule with Gemini AI!'
					: '📅 Updated weekly reading schedule & daily targets!';
			}
		} finally {
			isGeneratingSchedule = false;
		}
	}

	async function handleAddBook(e: SubmitEvent) {
		e.preventDefault();
		if (!newTitle.trim() || !newAuthor.trim()) return;
		isAddingBook = true;

		try {
			const res = await fetch('/api/books', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: newTitle,
					author: newAuthor,
					publisher: newPublisher,
					isbn13: newIsbn13,
					genre: newGenre,
					totalPages: Number(newTotalPages),
					status: newStatus
				})
			});
			const json = await res.json();
			if (json.ok) {
				await invalidateAll();
				newTitle = '';
				newAuthor = '';
				newPublisher = '';
				newIsbn13 = '';
				showAddBook = false;
				scheduleToast = `📚 Added "${json.book.title}" to your shelf (${json.book.status === 'reading' ? 'Reading' : 'Planned'})!`;
			}
		} finally {
			isAddingBook = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-extrabold tracking-tight text-zinc-900">
			Reading Planner
		</h1>
		<span
			class="rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-extrabold text-zinc-700"
			title="maxConcurrentBooks limit from app_user table"
		>
			📚 {activeReadingCount} / {maxConcurrent} Active Limit
		</span>
	</div>

	{#if scheduleToast}
		<div class="flex items-center justify-between rounded-2xl border border-reward-muted bg-reward-subtle px-4 py-3 text-xs font-bold text-reward-text">
			<span>{scheduleToast}</span>
			<button
				type="button"
				onclick={() => (scheduleToast = null)}
				class="ml-2 text-reward-text hover:opacity-70"
				aria-label="Close message"
			>
				✕
			</button>
		</div>
	{/if}

	<!-- 7-Day Habit Strip -->
	<StreakWeek days={weekDays} />

	<!-- Reading Schedule Header Card (reading_schedule table) -->
	<section class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-3">
		<div class="flex items-center justify-between">
			<span class="rounded-lg bg-accent-subtle px-2.5 py-1 text-xs font-extrabold text-accent uppercase">
				Active Schedule
			</span>
			<span class="text-xs font-bold text-zinc-400">
				~{weeklyPlan.projectedWeeklyPages} pages / week
			</span>
		</div>

		<div>
			<h2 class="text-lg font-extrabold text-zinc-900">
				{weeklyPlan.targetPagesPerDay} pages per day
			</h2>
			<p class="mt-1 text-xs text-zinc-600 leading-relaxed">
				{weeklyPlan.rationale}
			</p>
		</div>

		<div class="grid grid-cols-2 gap-2 pt-1 text-xs">
			<div class="rounded-xl bg-zinc-50 px-3 py-2">
				<span class="block text-[10px] font-bold text-zinc-400 uppercase">Target Finish</span>
				<span class="font-extrabold text-zinc-900">{weeklyPlan.targetFinishDate ?? '2026-10-31'}</span>
			</div>
			<div class="rounded-xl bg-zinc-50 px-3 py-2">
				<span class="block text-[10px] font-bold text-zinc-400 uppercase">Predicted Pace</span>
				<span class="font-extrabold text-zinc-900">{weeklyPlan.estimatedPagesPerDay ?? 26.5} pg/day</span>
			</div>
		</div>

		<div class="pt-2">
			<button
				type="button"
				onclick={() => (showScheduleGenerator = !showScheduleGenerator)}
				class="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-extrabold text-zinc-700 transition-colors hover:bg-zinc-100"
			>
				<span>{showScheduleGenerator ? 'Hide Schedule Generator' : '✨ Customize / Generate AI Schedule'}</span>
			</button>
		</div>

		{#if showScheduleGenerator}
			<form onsubmit={handleGenerateSchedule} class="mt-3 space-y-3 border-t border-zinc-100 pt-3 text-xs">
				<div>
					<label for="sched-book" class="block font-bold text-zinc-700">Focus Book</label>
					<select
						id="sched-book"
						bind:value={selectedBookId}
						class="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900"
					>
						{#each shelfQueue as b (b.id)}
							<option value={b.id}>{b.title} ({b.totalPages - b.currentPage} pg left)</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="sched-pages" class="block font-bold text-zinc-700">Daily Target Pages</label>
					<input
						id="sched-pages"
						type="number"
						min="5"
						max="200"
						bind:value={customDailyPages}
						required
						class="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-900"
					/>
				</div>

				<div>
					<label for="gemini-key" class="block font-bold text-zinc-700">
						Google Gemini API Key <span class="font-normal text-zinc-400">(optional BYOK — saved in browser)</span>
					</label>
					<input
						id="gemini-key"
						type="password"
						placeholder="AIzaSy... (leave blank for built-in math planner)"
						bind:value={geminiKey}
						class="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900"
					/>
				</div>

				<button
					type="submit"
					disabled={isGeneratingSchedule}
					class="flex min-h-[42px] w-full items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
				>
					{isGeneratingSchedule ? 'Generating Schedule...' : 'Generate Weekly Schedule'}
				</button>
			</form>
		{/if}
	</section>

	<!-- Daily Schedule Breakdown (schedule_day table) -->
	<section class="space-y-3">
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-zinc-200"></div>
			<h2 class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
				Daily Schedule Targets
			</h2>
			<div class="h-px flex-1 bg-zinc-200"></div>
		</div>

		<div class="space-y-2">
			{#each scheduleDays as day (day.scheduleDayId)}
				<div class="flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-xs">
					<div>
						<span class="font-extrabold text-zinc-900">{day.dayName} • {day.bookTitle}</span>
						<p class="text-[11px] text-zinc-400">{day.scheduledDate} • Target: {day.targetPages} pages</p>
					</div>
					<span
						class="rounded-lg px-2.5 py-1 text-[11px] font-extrabold uppercase {day.status === 'completed'
							? 'bg-reward-subtle text-reward-text'
							: 'bg-zinc-100 text-zinc-500'}"
					>
						{day.status}
					</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Reading Queue & Tsundoku Shelf (user_book table) -->
	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
				Shelf & Concurrency Queue
			</h2>
			<button
				type="button"
				onclick={() => (showAddBook = !showAddBook)}
				class="rounded-xl border-2 border-zinc-200 bg-white px-3 py-1.5 text-xs font-extrabold text-accent transition-colors hover:bg-zinc-50"
			>
				{showAddBook ? 'Cancel' : '+ Add Owned Book'}
			</button>
		</div>

		{#if showAddBook}
			<form onsubmit={handleAddBook} class="rounded-2xl border-2 border-zinc-200 bg-white p-4 space-y-3 text-xs">
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-extrabold text-zinc-900">Add Owned Book to Shelf</h3>
					<span class="text-[11px] font-bold text-zinc-400">
						{activeReadingCount}/{maxConcurrent} active slots used
					</span>
				</div>

				<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
					<div>
						<label for="book-title-input" class="block font-bold text-zinc-700">Title *</label>
						<input
							id="book-title-input"
							type="text"
							required
							placeholder="e.g. The Psychology of Money"
							bind:value={newTitle}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
						/>
					</div>
					<div>
						<label for="book-author-input" class="block font-bold text-zinc-700">Author *</label>
						<input
							id="book-author-input"
							type="text"
							required
							placeholder="e.g. Morgan Housel"
							bind:value={newAuthor}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
						/>
					</div>
					<div>
						<label for="book-publisher-input" class="block font-bold text-zinc-700">Publisher</label>
						<input
							id="book-publisher-input"
							type="text"
							placeholder="e.g. Harriman House"
							bind:value={newPublisher}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
						/>
					</div>
					<div>
						<label for="book-isbn-input" class="block font-bold text-zinc-700">ISBN-13 (13 digits)</label>
						<input
							id="book-isbn-input"
							type="text"
							maxlength="13"
							placeholder="e.g. 9780857197689"
							bind:value={newIsbn13}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
						/>
					</div>
					<div>
						<label for="book-pages-input" class="block font-bold text-zinc-700">Total Pages *</label>
						<input
							id="book-pages-input"
							type="number"
							min="1"
							required
							bind:value={newTotalPages}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs font-bold"
						/>
					</div>
					<div>
						<label for="book-status-input" class="block font-bold text-zinc-700">Initial Shelf Status</label>
						<select
							id="book-status-input"
							bind:value={newStatus}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold"
						>
							<option value="want_to_read">Planned (Up Next)</option>
							<option value="reading" disabled={activeReadingCount >= maxConcurrent}>
								Reading Now {activeReadingCount >= maxConcurrent ? '(Max Limit Reached)' : ''}
							</option>
						</select>
					</div>
				</div>

				<button
					type="submit"
					disabled={isAddingBook}
					class="flex min-h-[42px] w-full items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
				>
					{isAddingBook ? 'Adding Book...' : 'Save Book to Shelf'}
				</button>
			</form>
		{/if}

		<div class="space-y-2.5">
			{#each shelfQueue as book (book.id)}
				<a
					href="/books/{book.id}"
					class="flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300"
				>
					<div>
						<h3 class="text-sm font-extrabold text-zinc-900">{book.title}</h3>
						<p class="text-xs text-zinc-500">
							{book.author} • {book.currentPage}/{book.totalPages} pages
						</p>
					</div>
					{#if book.status === 'reading'}
						<span class="rounded-lg bg-accent-subtle px-2.5 py-1 text-[11px] font-extrabold text-accent uppercase">
							Reading
						</span>
					{:else if book.status === 'paused'}
						<span class="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700 uppercase">
							Paused
						</span>
					{:else if book.status === 'dropped'}
						<span class="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-extrabold text-red-600 uppercase">
							{book.dropReason ? dropReasonLabels[book.dropReason] : 'Dropped'}
						</span>
					{:else}
						<span class="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-extrabold text-zinc-500 uppercase">
							Planned
						</span>
					{/if}
				</a>
			{/each}
		</div>
	</section>
</div>
