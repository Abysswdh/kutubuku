<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { logReadingSession } from '$lib/data/mock';
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

	// XP Toast Feedback State
	let xpMessage = $state<{
		xp: number;
		streak: number;
		pages: number;
	} | null>(null);

	let messageTimer: ReturnType<typeof setTimeout> | null = null;

	let progressPercent = $derived(
		book.totalPages <= 0 ? 0 : Math.round((book.currentPage / book.totalPages) * 100)
	);

	function incrementPages(delta: number) {
		pagesRead = Math.max(1, pagesRead + delta);
	}

	async function handleSaveSession(e: SubmitEvent) {
		e.preventDefault();
		if (pagesRead < 1) return;

		isSubmitting = true;

		try {
			// Update in-memory state
			const result = logReadingSession({
				bookId: book.id,
				pagesRead: Number(pagesRead),
				minutesRead: minutesRead === '' ? undefined : Number(minutesRead),
				notes: notes.trim() || undefined
			});

			// Re-run load functions to update reactive page data
			await invalidateAll();

			// Show XP gain feedback notification
			xpMessage = {
				xp: result.xpEarned,
				streak: result.newStreak,
				pages: result.session.pagesRead
			};

			// Reset optional note field; retain a sensible default for next session
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

<div class="space-y-6">
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

		<span class="text-xs font-medium text-zinc-500 uppercase tracking-wider">
			Book Details
		</span>
	</div>

	<!-- Book Header Card -->
	<header
		class="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs"
		aria-labelledby="book-title"
	>
		<div class="flex items-start gap-4">
			<!-- Cover Placeholder -->
			<div
				class="flex h-24 w-16 shrink-0 flex-col items-center justify-between rounded-xl p-2 text-white shadow-2xs"
				style="background-color: {book.coverColor || 'var(--color-accent)'};"
				aria-hidden="true"
			>
				<span class="text-[9px] font-bold tracking-wider uppercase opacity-80">Book</span>
				<svg
					class="h-7 w-7 opacity-90"
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
				<span class="text-[9px] font-semibold opacity-90">{progressPercent}%</span>
			</div>

			<!-- Title and Metadata -->
			<div class="flex min-w-0 flex-1 flex-col">
				<span class="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
					{book.genre || 'Reading'}
				</span>
				<h1 id="book-title" class="text-lg font-black tracking-tight text-zinc-900 truncate">
					{book.title}
				</h1>
				<p class="text-xs text-zinc-600 truncate">{book.author}</p>

				<div class="mt-3">
					<ProgressBar
						value={book.currentPage}
						max={book.totalPages}
						sublabel="{book.currentPage} / {book.totalPages} pages"
						showPercentage={true}
						heightClass="h-2"
					/>
				</div>
			</div>
		</div>
	</header>

	<!-- XP Notification Banner (shown after saving a session) -->
	{#if xpMessage}
		<div
			in:fly={{ y: -8, duration: 250 }}
			out:fade={{ duration: 150 }}
			role="status"
			aria-live="polite"
			class="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent-subtle px-4 py-3 text-accent"
		>
			<div class="flex items-center gap-2.5">
				<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
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
					<p class="text-xs font-bold text-accent-text">
						+{xpMessage.xp} XP Gained!
					</p>
					<p class="text-[11px] text-accent">
						Logged {xpMessage.pages} pages • Streak maintained at {xpMessage.streak} days
					</p>
				</div>
			</div>

			<button
				type="button"
				onclick={() => (xpMessage = null)}
				class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-accent hover:opacity-75"
				aria-label="Dismiss message"
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
		class="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs"
	>
		<div class="mb-4">
			<h2 id="log-form-title" class="text-sm font-bold tracking-tight text-zinc-900">
				Log Today's Reading
			</h2>
			<p class="text-xs text-zinc-500">
				Record what you read to gain XP and keep your streak alive.
			</p>
		</div>

		<form onsubmit={handleSaveSession} class="space-y-4">
			<!-- Stepper: Pages Read -->
			<div>
				<label for="pages-read" class="block text-xs font-semibold text-zinc-700">
					Pages Read
				</label>

				<div class="mt-1.5 flex items-center gap-2">
					<!-- Decrement Button -->
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

					<!-- Increment Button -->
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
				<div class="mt-2 flex items-center gap-2">
					<span class="text-[11px] text-zinc-500">Quick add:</span>
					{#each [5, 10, 20] as preset}
						<button
							type="button"
							onclick={() => incrementPages(preset)}
							class="flex min-h-[32px] items-center rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
						>
							+{preset}
						</button>
					{/each}
				</div>
			</div>

			<!-- Optional Minutes Read -->
			<div>
				<label for="minutes-read" class="block text-xs font-semibold text-zinc-700">
					Minutes Read <span class="font-normal text-zinc-400">(optional)</span>
				</label>
				<input
					id="minutes-read"
					type="number"
					min="1"
					placeholder="e.g. 25"
					bind:value={minutesRead}
					class="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent focus:outline-hidden"
				/>
			</div>

			<!-- Optional Short Note -->
			<div>
				<label for="session-notes" class="block text-xs font-semibold text-zinc-700">
					Notes or Key Takeaway <span class="font-normal text-zinc-400">(optional)</span>
				</label>
				<textarea
					id="session-notes"
					rows="2"
					placeholder="What stood out in this chapter?"
					bind:value={notes}
					class="mt-1.5 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-accent focus:outline-hidden"
				></textarea>
			</div>

			<!-- Save Button (min 44px) -->
			<button
				type="submit"
				disabled={isSubmitting}
				class="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover active:bg-accent-text disabled:opacity-50"
			>
				{#if isSubmitting}
					<span class="text-xs">Saving...</span>
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

	<!-- Recent Sessions for this Book -->
	<section aria-labelledby="history-heading" class="space-y-3">
		<div class="flex items-center justify-between px-1">
			<h2 id="history-heading" class="text-xs font-bold tracking-wider text-zinc-700 uppercase">
				Recent Sessions ({sessions.length})
			</h2>
		</div>

		{#if sessions.length === 0}
			<div
				class="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center text-xs text-zinc-500"
			>
				No reading sessions recorded for this book yet.
			</div>
		{:else}
			<ul class="space-y-2.5" role="list">
				{#each sessions as session (session.id)}
					<li class="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="text-xs font-bold text-zinc-900">
									+{session.pagesRead} pages
								</span>
								{#if session.minutesRead}
									<span class="text-[11px] text-zinc-400">· {session.minutesRead} min</span>
								{/if}
							</div>

							<div class="flex items-center gap-2">
								<span
									class="rounded-md bg-accent-subtle px-1.5 py-0.5 text-[10px] font-bold text-accent"
								>
									+{session.xpEarned} XP
								</span>
								<time
									datetime={session.loggedAt}
									class="text-[11px] font-medium text-zinc-500"
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
