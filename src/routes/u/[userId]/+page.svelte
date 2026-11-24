<script lang="ts">
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let profile = $derived(data.profile);
</script>

<div class="mx-auto max-w-xl space-y-6">
	<!-- Public Reader Card -->
	<section class="rounded-2xl border-2 border-zinc-200 bg-white p-6 space-y-4">
		<div class="flex items-center gap-4">
			<div
				class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-black text-white"
			>
				{profile.initials}
			</div>
			<div class="min-w-0 flex-1">
				<span class="rounded-md bg-accent-subtle px-2 py-0.5 text-[10px] font-extrabold text-accent-text uppercase">
					Public Reader Card
				</span>
				<h1 class="mt-1 truncate text-xl font-black text-zinc-900">{profile.userName}</h1>
				<p class="text-xs font-semibold text-zinc-400">
					Level {profile.currentLevel} · Joined {profile.memberSince}
				</p>
			</div>
		</div>

		<div class="grid grid-cols-3 gap-2.5">
			<div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
				<div class="text-lg font-black text-zinc-900">🔥 {profile.streakDays}</div>
				<div class="text-[11px] font-bold text-zinc-400 uppercase">Streak</div>
			</div>
			<div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
				<div class="text-lg font-black text-zinc-900">⚡ {profile.totalXp}</div>
				<div class="text-[11px] font-bold text-zinc-400 uppercase">Total XP</div>
			</div>
			<div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
				<div class="text-lg font-black text-zinc-900">
					📚 {profile.books.filter((b) => b.status === 'finished').length}
				</div>
				<div class="text-[11px] font-bold text-zinc-400 uppercase">Finished</div>
			</div>
		</div>
	</section>

	{#if profile.challenge}
		<section class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-extrabold text-zinc-900">
					🏆 {profile.challenge.year} Reading Challenge
				</h2>
				<span class="rounded-lg bg-reward-subtle px-2.5 py-0.5 text-[11px] font-extrabold text-reward-text">
					{profile.challenge.completedBooks} / {profile.challenge.targetBooks} Books
				</span>
			</div>
			<ProgressBar
				value={profile.challenge.completedBooks}
				max={profile.challenge.targetBooks}
				sublabel="{profile.challenge.completedBooks} of {profile.challenge.targetBooks} books finished"
				heightClass="h-2"
			/>
		</section>
	{/if}

	{#if profile.badges.length > 0}
		<section class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-3">
			<h2 class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
				Unlocked Badges ({profile.badges.length})
			</h2>
			<div class="flex flex-wrap gap-2">
				{#each profile.badges as badge (badge.id)}
					<span class="rounded-xl border border-reward-muted bg-reward-subtle px-3 py-1.5 text-xs font-extrabold text-reward-text">
						🏅 {badge.title}
					</span>
				{/each}
			</div>
		</section>
	{/if}

	{#if profile.books.length > 0}
		<section class="space-y-3">
			<h2 class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
				Public Bookshelf
			</h2>
			<div class="space-y-2.5">
				{#each profile.books as book (book.bookId)}
					<div class="rounded-2xl border-2 border-zinc-200 bg-white p-4 space-y-2">
						<div class="flex items-center justify-between gap-2">
							<div class="min-w-0">
								<h3 class="truncate text-sm font-extrabold text-zinc-900">{book.title}</h3>
								<p class="truncate text-xs font-semibold text-zinc-500">{book.author}</p>
							</div>
							<span
								class="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase {book.status === 'finished'
									? 'bg-accent-subtle text-accent-text'
									: 'bg-reward-subtle text-reward-text'}"
							>
								{book.status === 'finished' ? 'Finished' : 'Reading'}
							</span>
						</div>
						<ProgressBar
							value={book.currentPage}
							max={book.totalPages}
							sublabel="{book.currentPage} / {book.totalPages} pages"
							heightClass="h-1.5"
						/>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if !data.isLoggedIn}
		<section class="rounded-2xl border-2 border-accent/30 bg-accent-subtle p-5 text-center space-y-2.5">
			<p class="text-sm font-extrabold text-accent-text">
				Want to build your own reading streak?
			</p>
			<a
				href="/auth"
				class="inline-block rounded-xl bg-accent px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-accent-hover"
			>
				Join Kutubuku Free →
			</a>
		</section>
	{/if}
</div>
