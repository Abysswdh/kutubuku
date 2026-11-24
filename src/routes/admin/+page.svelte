<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { AdminBadgeRow, CatalogBook, VerificationStatus } from '$lib/server/catalog';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let activeTab = $state<'queue' | 'catalog' | 'users' | 'badges'>('queue');
	let busyId = $state<string | null>(null);
	let feedback = $state<string | null>(null);
	let errorMsg = $state<string | null>(null);

	let pendingBooks = $derived(data.books.filter((b) => b.verificationStatus === 'pending'));

	// Catalog search & status filter
	let catalogSearch = $state('');
	let catalogFilter = $state<'all' | VerificationStatus>('all');
	let showCreateForm = $state(false);

	let filteredBooks = $derived.by(() => {
		const q = catalogSearch.trim().toLowerCase();
		return data.books.filter((b) => {
			if (catalogFilter !== 'all' && b.verificationStatus !== catalogFilter) return false;
			if (!q) return true;
			return (
				b.title.toLowerCase().includes(q) ||
				b.author.toLowerCase().includes(q) ||
				b.bookId.toLowerCase().includes(q)
			);
		});
	});

	// Shared inline edit + delete confirmation state
	let editingBookId = $state<string | null>(null);
	let editTitle = $state('');
	let editAuthor = $state('');
	let editPublisher = $state('');
	let editGenre = $state('');
	let editIsbn = $state('');
	let editPages = $state(250);
	let confirmDeleteId = $state<string | null>(null);

	// Official book creation state
	let newTitle = $state('');
	let newAuthor = $state('');
	let newPublisher = $state('');
	let newGenre = $state('');
	let newIsbn = $state('');
	let newPages = $state('300');
	let isCreating = $state(false);

	// Badge creation state
	let badgeName = $state('');
	let badgeDesc = $state('');
	let badgeCriteriaType = $state<AdminBadgeRow['criteriaType']>('streak_days');
	let badgeCriteriaValue = $state('7');
	let isCreatingBadge = $state(false);

	function startEdit(book: CatalogBook) {
		editingBookId = book.bookId;
		confirmDeleteId = null;
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
			feedback = `Updated ${bookId} (${status.toUpperCase()}).`;
			await invalidateAll();
		} finally {
			busyId = null;
		}
	}

	async function deleteBookPermanently(bookId: string) {
		busyId = bookId;
		feedback = null;
		errorMsg = null;
		try {
			const res = await fetch('/api/admin/books', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bookId })
			});
			const json = await res.json();
			if (!json.ok) {
				errorMsg = json.error ?? 'Could not delete book.';
				return;
			}
			confirmDeleteId = null;
			editingBookId = null;
			feedback = `Permanently deleted ${bookId} from database.`;
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
			showCreateForm = false;
			feedback = `Added verified book ${json.bookId} to Master Catalog!`;
			await invalidateAll();
		} finally {
			isCreating = false;
		}
	}

	async function toggleUserRole(userId: string, currentRole: 'user' | 'admin') {
		busyId = userId;
		feedback = null;
		errorMsg = null;
		const nextRole = currentRole === 'admin' ? 'user' : 'admin';
		try {
			const res = await fetch('/api/admin/users', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, role: nextRole })
			});
			const json = await res.json();
			if (!json.ok) {
				errorMsg = json.error ?? 'Failed to update role.';
				return;
			}
			feedback = `Updated ${userId} role to ${nextRole.toUpperCase()}.`;
			await invalidateAll();
		} finally {
			busyId = null;
		}
	}

	async function handleCreateBadge(e: SubmitEvent) {
		e.preventDefault();
		isCreatingBadge = true;
		feedback = null;
		errorMsg = null;
		try {
			const res = await fetch('/api/admin/badges', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					badgeName,
					description: badgeDesc,
					criteriaType: badgeCriteriaType,
					criteriaValue: Number(badgeCriteriaValue)
				})
			});
			const json = await res.json();
			if (!json.ok) {
				errorMsg = json.error ?? 'Failed to create badge.';
				return;
			}
			badgeName = '';
			badgeDesc = '';
			badgeCriteriaValue = '7';
			feedback = `Created badge ${json.badgeId}!`;
			await invalidateAll();
		} finally {
			isCreatingBadge = false;
		}
	}

	async function deleteBadge(badgeId: string) {
		busyId = badgeId;
		feedback = null;
		errorMsg = null;
		try {
			const res = await fetch('/api/admin/badges', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ badgeId })
			});
			const json = await res.json();
			if (!json.ok) {
				errorMsg = json.error ?? 'Failed to delete badge.';
				return;
			}
			confirmDeleteId = null;
			feedback = `Deleted badge ${badgeId}.`;
			await invalidateAll();
		} finally {
			busyId = null;
		}
	}
</script>

<div class="space-y-5">
	<div>
		<span class="rounded-md bg-reward-subtle px-2 py-0.5 text-[10px] font-extrabold text-reward-text uppercase">
			Admin Moderator
		</span>
		<h1 class="mt-1 text-xl font-extrabold tracking-tight text-zinc-900">
			Platform Control
		</h1>
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

	<!-- 4-Tab Switcher -->
	<div class="grid grid-cols-4 gap-1 rounded-2xl border-2 border-zinc-200 bg-white p-1.5 text-xs font-extrabold">
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
			onclick={() => (activeTab = 'catalog')}
			class="rounded-xl py-2 transition {activeTab === 'catalog'
				? 'bg-accent text-white'
				: 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}"
		>
			Catalog ({data.books.length})
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'users')}
			class="rounded-xl py-2 transition {activeTab === 'users'
				? 'bg-accent text-white'
				: 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}"
		>
			Users ({data.users.length})
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'badges')}
			class="rounded-xl py-2 transition {activeTab === 'badges'
				? 'bg-accent text-white'
				: 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}"
		>
			Badges ({data.badges.length})
		</button>
	</div>

	{#if activeTab === 'queue'}
		{#if pendingBooks.length === 0}
			<div class="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-6 text-center space-y-1.5">
				<div class="text-2xl" aria-hidden="true">✅</div>
				<p class="text-sm font-extrabold text-zinc-800">Moderation queue is clear!</p>
				<p class="text-xs font-medium text-zinc-400">
					User-submitted books will appear here for you to verify, edit, or delete.
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
								<input type="text" bind:value={editTitle} placeholder="Title" class="col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
								<input type="text" bind:value={editAuthor} placeholder="Author" class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
								<input type="text" bind:value={editPublisher} placeholder="Publisher" class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
								<input type="text" bind:value={editGenre} placeholder="Genre" class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
								<input type="number" min="1" bind:value={editPages} placeholder="Pages" class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
								<input type="text" bind:value={editIsbn} placeholder="ISBN-13 (13 digits, optional)" class="col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
							</div>
						{/if}

						<div class="flex flex-wrap items-center gap-2 pt-1">
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
								class="rounded-xl border-2 border-zinc-200 bg-white px-3 py-2 text-xs font-extrabold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
							>
								Reject
							</button>
							{#if confirmDeleteId === book.bookId}
								<button
									type="button"
									disabled={busyId === book.bookId}
									onclick={() => deleteBookPermanently(book.bookId)}
									class="rounded-xl bg-red-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-red-700"
								>
									Confirm Delete
								</button>
								<button
									type="button"
									onclick={() => (confirmDeleteId = null)}
									class="rounded-xl border border-zinc-200 px-2.5 py-2 text-xs font-bold text-zinc-500"
								>
									Cancel
								</button>
							{:else}
								<button
									type="button"
									onclick={() => (confirmDeleteId = book.bookId)}
									class="rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-600 hover:bg-red-100"
								>
									Delete
								</button>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		{/if}
	{:else if activeTab === 'catalog'}
		<div class="space-y-3.5">
			<!-- Search + Official Book Button -->
			<div class="flex gap-2">
				<input
					type="search"
					bind:value={catalogSearch}
					placeholder="Search title, author, or book ID..."
					class="flex-1 rounded-2xl border-2 border-zinc-200 bg-white px-4 py-2 text-xs font-semibold focus:border-accent focus:outline-none"
				/>
				<button
					type="button"
					onclick={() => (showCreateForm = !showCreateForm)}
					class="shrink-0 rounded-2xl border-2 px-3.5 py-2 text-xs font-extrabold transition {showCreateForm
						? 'border-zinc-200 bg-white text-zinc-600'
						: 'border-accent bg-accent text-white hover:bg-accent-hover'}"
				>
					{showCreateForm ? 'Close' : '+ Official Book'}
				</button>
			</div>

			{#if showCreateForm}
				<form
					onsubmit={handleCreateOfficial}
					class="rounded-2xl border-2 border-accent/30 bg-white p-5 space-y-3"
				>
					<h2 class="text-sm font-extrabold text-zinc-900">Add Official Verified Book</h2>
					<input type="text" required bind:value={newTitle} placeholder="Book title *" class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-semibold focus:border-accent focus:bg-white focus:outline-none" />
					<div class="grid grid-cols-2 gap-2.5">
						<input type="text" required bind:value={newAuthor} placeholder="Author *" class="rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none" />
						<input type="text" required bind:value={newPublisher} placeholder="Publisher *" class="rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none" />
						<input type="text" required bind:value={newGenre} placeholder="Genre *" class="rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none" />
						<input type="number" min="1" required bind:value={newPages} placeholder="Page count *" class="rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none" />
					</div>
					<input type="text" bind:value={newIsbn} placeholder="ISBN-13 (13 digits, optional)" class="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none" />
					<button
						type="submit"
						disabled={isCreating}
						class="w-full rounded-xl bg-accent py-2.5 text-xs font-extrabold text-white uppercase hover:bg-accent-hover disabled:opacity-50"
					>
						{isCreating ? 'Adding book...' : '+ Publish Verified Book'}
					</button>
				</form>
			{/if}

			<!-- Status filter pills -->
			<div class="flex gap-1.5">
				{#each ['all', 'verified', 'pending', 'rejected'] as f (f)}
					<button
						type="button"
						onclick={() => (catalogFilter = f as 'all' | VerificationStatus)}
						class="rounded-xl border-2 px-3 py-1 text-xs font-extrabold capitalize transition {catalogFilter === f
							? 'border-accent bg-accent text-white'
							: 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'}"
					>
						{f}
					</button>
				{/each}
			</div>

			<div class="space-y-2.5">
				{#each filteredBooks as book (book.bookId)}
					<article class="rounded-2xl border-2 border-zinc-200 bg-white p-3.5 space-y-3">
						<div class="flex items-start justify-between gap-3">
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
									{book.author} · {book.publisher} · {book.genre}
								</div>
							</div>

							<div class="flex shrink-0 items-center gap-1.5">
								<button
									type="button"
									onclick={() => (editingBookId === book.bookId ? (editingBookId = null) : startEdit(book))}
									class="rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
								>
									{editingBookId === book.bookId ? 'Close' : 'Edit'}
								</button>
								{#if book.verificationStatus !== 'verified'}
									<button
										type="button"
										disabled={busyId === book.bookId}
										onclick={() => moderate(book.bookId, 'verified')}
										class="rounded-xl bg-accent px-2.5 py-1.5 text-xs font-extrabold text-white hover:bg-accent-hover disabled:opacity-50"
									>
										Verify
									</button>
								{:else}
									<button
										type="button"
										disabled={busyId === book.bookId}
										onclick={() => moderate(book.bookId, 'pending')}
										class="rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
									>
										Unverify
									</button>
								{/if}
								{#if confirmDeleteId === book.bookId}
									<button
										type="button"
										disabled={busyId === book.bookId}
										onclick={() => deleteBookPermanently(book.bookId)}
										class="rounded-xl bg-red-600 px-2.5 py-1.5 text-xs font-extrabold text-white hover:bg-red-700"
									>
										Confirm
									</button>
									<button
										type="button"
										onclick={() => (confirmDeleteId = null)}
										class="rounded-xl border border-zinc-200 px-2 py-1.5 text-xs font-bold text-zinc-500"
									>
										✕
									</button>
								{:else}
									<button
										type="button"
										onclick={() => (confirmDeleteId = book.bookId)}
										class="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-extrabold text-red-600 hover:bg-red-100"
									>
										Delete
									</button>
								{/if}
							</div>
						</div>

						{#if editingBookId === book.bookId}
							<div class="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3">
								<input type="text" bind:value={editTitle} placeholder="Title" class="col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
								<input type="text" bind:value={editAuthor} placeholder="Author" class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
								<input type="text" bind:value={editPublisher} placeholder="Publisher" class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
								<input type="text" bind:value={editGenre} placeholder="Genre" class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
								<input type="number" min="1" bind:value={editPages} placeholder="Pages" class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
								<input type="text" bind:value={editIsbn} placeholder="ISBN-13 (13 digits, optional)" class="col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold" />
								<button
									type="button"
									disabled={busyId === book.bookId}
									onclick={() => moderate(book.bookId, book.verificationStatus, true)}
									class="col-span-2 rounded-xl bg-accent py-2 text-xs font-extrabold text-white hover:bg-accent-hover disabled:opacity-50"
								>
									Save Book Edits
								</button>
							</div>
						{/if}
					</article>
				{/each}
			</div>
		</div>
	{:else if activeTab === 'users'}
		<div class="space-y-2.5">
			{#each data.users as u (u.userId)}
				<div class="flex items-center justify-between gap-3 rounded-2xl border-2 border-zinc-200 bg-white p-3.5">
					<div class="min-w-0 space-y-0.5">
						<div class="flex flex-wrap items-center gap-1.5">
							<span
								class="rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase {u.role === 'admin'
									? 'bg-reward-subtle text-reward-text'
									: 'bg-zinc-100 text-zinc-600'}"
							>
								{u.role}
							</span>
							<span class="rounded-md bg-accent-subtle px-2 py-0.5 text-[10px] font-bold text-accent-text uppercase">
								{u.authMethod}
							</span>
							<span class="text-[11px] font-bold text-zinc-400">{u.userId}</span>
						</div>
						<div class="truncate text-sm font-extrabold text-zinc-900">
							{u.userName}
							{#if u.userId === data.currentUserId}
								<span class="text-xs font-bold text-accent">(You)</span>
							{/if}
						</div>
						<div class="truncate text-xs font-semibold text-zinc-500">
							{u.userEmail} · 🔥 {u.streakDays}d · 📚 {u.booksCount} books
						</div>
					</div>

					<div class="flex shrink-0 items-center gap-1.5">
						<a
							href="/u/{u.userId}"
							class="rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
						>
							Profile
						</a>
						<button
							type="button"
							disabled={busyId === u.userId || u.userId === data.currentUserId}
							onclick={() => toggleUserRole(u.userId, u.role)}
							class="rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold transition disabled:opacity-40 {u.role === 'admin'
								? 'border-zinc-200 bg-white text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
								: 'border-accent bg-accent text-white hover:bg-accent-hover'}"
						>
							{u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="space-y-4">
			<!-- Create Badge Form -->
			<form
				onsubmit={handleCreateBadge}
				class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-3"
			>
				<h2 class="text-sm font-extrabold text-zinc-900">+ Create Achievement Badge</h2>
				<div class="grid grid-cols-2 gap-2.5">
					<input
						type="text"
						required
						bind:value={badgeName}
						placeholder="Badge name (e.g. Century Club)"
						class="col-span-2 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none"
					/>
					<input
						type="text"
						required
						bind:value={badgeDesc}
						placeholder="Description"
						class="col-span-2 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none"
					/>
					<select
						bind:value={badgeCriteriaType}
						class="rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-800 focus:border-accent focus:bg-white focus:outline-none"
					>
						<option value="streak_days">Streak Days</option>
						<option value="books_finished">Books Finished</option>
						<option value="pages_read">Pages Read</option>
					</select>
					<input
						type="number"
						min="1"
						required
						bind:value={badgeCriteriaValue}
						placeholder="Target value"
						class="rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none"
					/>
				</div>
				<button
					type="submit"
					disabled={isCreatingBadge}
					class="w-full rounded-xl bg-accent py-2.5 text-xs font-extrabold text-white uppercase hover:bg-accent-hover disabled:opacity-50"
				>
					{isCreatingBadge ? 'Creating...' : '+ Add Badge'}
				</button>
			</form>

			<div class="space-y-2.5">
				{#each data.badges as badge (badge.badgeId)}
					<div class="flex items-center justify-between gap-3 rounded-2xl border-2 border-zinc-200 bg-white p-3.5">
						<div class="min-w-0">
							<div class="flex items-center gap-1.5">
								<span class="rounded-md bg-reward-subtle px-2 py-0.5 text-[10px] font-extrabold text-reward-text uppercase">
									{badge.criteriaType.replace('_', ' ')} ≥ {badge.criteriaValue}
								</span>
								<span class="text-[11px] font-bold text-zinc-400">
									{badge.badgeId} · {badge.unlockedCount} unlocked
								</span>
							</div>
							<div class="mt-0.5 truncate text-sm font-extrabold text-zinc-900">🏅 {badge.badgeName}</div>
							<div class="truncate text-xs font-medium text-zinc-500">{badge.description}</div>
						</div>

						<div class="shrink-0">
							{#if confirmDeleteId === badge.badgeId}
								<div class="flex items-center gap-1">
									<button
										type="button"
										disabled={busyId === badge.badgeId}
										onclick={() => deleteBadge(badge.badgeId)}
										class="rounded-xl bg-red-600 px-2.5 py-1.5 text-xs font-extrabold text-white"
									>
										Confirm
									</button>
									<button
										type="button"
										onclick={() => (confirmDeleteId = null)}
										class="rounded-xl border border-zinc-200 px-2 py-1.5 text-xs font-bold text-zinc-500"
									>
										✕
									</button>
								</div>
							{:else}
								<button
									type="button"
									onclick={() => (confirmDeleteId = badge.badgeId)}
									class="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-extrabold text-red-600 hover:bg-red-100"
								>
									Delete
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
