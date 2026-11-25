<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { t, type Lang } from '$lib/i18n';
	import type { PageProps } from './$types';
	import StreakWeek from '$lib/components/StreakWeek.svelte';

	let { data }: PageProps = $props();

	let lang = $derived<Lang>(page.data.lang === 'en' ? 'en' : 'id');
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

	let showScheduleGenerator = $state(false);
	let selectedBookId = $state('');
	let customDailyPages = $state(28);
	let selectedDays = $state<number[]>([1, 2, 3, 4, 5, 6, 7]);
	let daysInitialized = $state(false);
	let geminiKey = $state(
		typeof window !== 'undefined' ? localStorage.getItem('kutubuku_gemini_key') ?? '' : ''
	);
	let isGeneratingSchedule = $state(false);
	let busyDayId = $state<string | null>(null);
	let scheduleToast = $state<string | null>(null);
	let aiRationaleNote = $state<string | null>(null);
	let plannerError = $state<string | null>(null);

	let showAddBook = $state(false);
	let newTitle = $state('');
	let newAuthor = $state('');
	let newPublisher = $state('');
	let newIsbn13 = $state('');
	let newGenre = $state('Self-Improvement');
	let newTotalPages = $state(250);
	let newStatus = $state<'reading' | 'want_to_read'>('want_to_read');
	let isAddingBook = $state(false);

	let weekDayOptions = $derived([
		{ day: 1, label: t(lang, 'Sen', 'Mon') },
		{ day: 2, label: t(lang, 'Sel', 'Tue') },
		{ day: 3, label: t(lang, 'Rab', 'Wed') },
		{ day: 4, label: t(lang, 'Kam', 'Thu') },
		{ day: 5, label: t(lang, 'Jum', 'Fri') },
		{ day: 6, label: t(lang, 'Sab', 'Sat') },
		{ day: 7, label: t(lang, 'Min', 'Sun') }
	]);

	let dropReasonLabels = $derived<Record<string, string>>({
		too_many_books: t(lang, 'Berhenti: Terlalu Banyak Buku', 'Dropped: Too Many Books'),
		overwhelmed: t(lang, 'Berhenti: Kewalahan', 'Dropped: Overwhelmed'),
		lost_interest: t(lang, 'Berhenti: Kurang Cocok', 'Dropped: Lost Interest'),
		other: t(lang, 'Berhenti', 'Dropped')
	});

	$effect(() => {
		if (!selectedBookId || !shelfQueue.some((b) => b.id === selectedBookId)) {
			const preferred = weeklyPlan.bookId && shelfQueue.some((b) => b.id === weeklyPlan.bookId)
				? weeklyPlan.bookId
				: shelfQueue[0]?.id ?? '';
			selectedBookId = preferred;
		}
		if (!daysInitialized && weeklyPlan.activeDaysOfWeek?.length) {
			selectedDays = [...weeklyPlan.activeDaysOfWeek];
			customDailyPages = weeklyPlan.targetPagesPerDay || 20;
			daysInitialized = true;
		}
	});

	function togglePreferredDay(day: number) {
		if (selectedDays.includes(day)) {
			if (selectedDays.length <= 1) return;
			selectedDays = selectedDays.filter((d) => d !== day);
		} else {
			selectedDays = [...selectedDays, day].sort((a, b) => a - b);
		}
	}

	async function handleGenerateSchedule(e: SubmitEvent) {
		e.preventDefault();
		if (!selectedBookId) {
			plannerError = t(lang, 'Tambahkan buku ke rak dulu sebelum membuat jadwal.', 'Add a book to your shelf before generating a schedule.');
			return;
		}

		isGeneratingSchedule = true;
		scheduleToast = null;
		plannerError = null;

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
					activeDaysOfWeek: selectedDays,
					geminiApiKey: geminiKey.trim() || undefined,
					bookTitle: targetBook?.title,
					remainingPages
				})
			});
			const json = await res.json();
			if (!json.ok) {
				plannerError = json.error ?? t(lang, 'Gagal membuat jadwal.', 'Failed to generate schedule.');
				return;
			}

			aiRationaleNote = json.rationale ?? null;
			await invalidateAll();
			showScheduleGenerator = false;
			scheduleToast = json.usedAi
				? t(lang, '✨ Jadwal mingguan dibuat dengan Gemini AI!', '✨ Generated smart weekly schedule with Gemini AI!')
				: t(lang, '📅 Jadwal baca & target harian tersimpan!', '📅 Weekly reading schedule & daily targets saved!');
		} finally {
			isGeneratingSchedule = false;
		}
	}

	async function handleToggleDayStatus(scheduleDayId: string, currentStatus: 'pending' | 'completed' | 'missed') {
		if (busyDayId) return;
		busyDayId = scheduleDayId;
		plannerError = null;
		const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';

		try {
			const res = await fetch('/api/schedule', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scheduleDayId, status: nextStatus })
			});
			const json = await res.json();
			if (!json.ok) {
				plannerError = json.error ?? t(lang, 'Gagal mengubah status jadwal.', 'Could not update schedule day.');
				return;
			}
			await invalidateAll();
		} finally {
			busyDayId = null;
		}
	}

	async function handleAddBook(e: SubmitEvent) {
		e.preventDefault();
		if (!newTitle.trim() || !newAuthor.trim()) return;
		isAddingBook = true;
		plannerError = null;

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
			if (!json.ok) {
				plannerError = json.error ?? t(lang, 'Gagal menambahkan buku.', 'Could not add book.');
				return;
			}

			await invalidateAll();
			newTitle = '';
			newAuthor = '';
			newPublisher = '';
			newIsbn13 = '';
			showAddBook = false;
			scheduleToast = t(
				lang,
				`📚 "${json.book.title}" ditambahkan ke rak (${json.book.status === 'reading' ? 'Dibaca' : 'Rencana'})!`,
				`📚 Added "${json.book.title}" to your shelf (${json.book.status === 'reading' ? 'Reading' : 'Planned'})!`
			);
		} finally {
			isAddingBook = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-extrabold tracking-tight text-zinc-900">
			{t(lang, 'Jadwal Baca', 'Reading Planner')}
		</h1>
		<span
			class="rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-extrabold text-zinc-700"
			title={t(lang, 'Batas buku aktif bersamaan', 'maxConcurrentBooks limit from app_user table')}
		>
			📚 {activeReadingCount} / {maxConcurrent} {t(lang, 'Batas Aktif', 'Active Limit')}
		</span>
	</div>

	{#if plannerError}
		<div class="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
			<span>⚠️ {plannerError}</span>
			<button
				type="button"
				onclick={() => (plannerError = null)}
				class="ml-2 hover:opacity-70"
				aria-label={t(lang, 'Tutup pesan', 'Close error')}
			>
				✕
			</button>
		</div>
	{/if}

	{#if scheduleToast}
		<div class="flex items-center justify-between rounded-2xl border border-reward-muted bg-reward-subtle px-4 py-3 text-xs font-bold text-reward-text">
			<span>{scheduleToast}</span>
			<button
				type="button"
				onclick={() => (scheduleToast = null)}
				class="ml-2 text-reward-text hover:opacity-70"
				aria-label={t(lang, 'Tutup pesan', 'Close message')}
			>
				✕
			</button>
		</div>
	{/if}

	<!-- 7-Day Habit Strip -->
	<StreakWeek days={weekDays} />

	<!-- Reading Schedule Header Card -->
	<section class="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-3">
		<div class="flex items-center justify-between">
			<span class="rounded-lg bg-accent-subtle px-2.5 py-1 text-xs font-extrabold text-accent uppercase">
				{weeklyPlan.scheduleId
					? t(lang, 'Jadwal Aktif', 'Active Schedule')
					: t(lang, 'Belum Ada Jadwal', 'No Schedule Yet')}
			</span>
			<span class="text-xs font-bold text-zinc-400">
				~{weeklyPlan.projectedWeeklyPages} {t(lang, 'hlm / minggu', 'pages / week')}
			</span>
		</div>

		{#if weeklyPlan.scheduleId}
			<div>
				<p class="text-[11px] font-extrabold tracking-wider text-accent uppercase">
					{weeklyPlan.recommendedBookTitle}
				</p>
				<h2 class="text-lg font-extrabold text-zinc-900">
					{weeklyPlan.targetPagesPerDay} {t(lang, 'halaman per hari', 'pages per day')}
				</h2>
				<p class="mt-1 text-xs text-zinc-600 leading-relaxed">
					{aiRationaleNote ?? weeklyPlan.rationale}
				</p>
			</div>

			<div class="grid grid-cols-2 gap-2 pt-1 text-xs">
				<div class="rounded-xl bg-zinc-50 px-3 py-2">
					<span class="block text-[10px] font-bold text-zinc-400 uppercase">
						{t(lang, 'Target Selesai', 'Target Finish')}
					</span>
					<span class="font-extrabold text-zinc-900">{weeklyPlan.targetFinishDate ?? '—'}</span>
				</div>
				<div class="rounded-xl bg-zinc-50 px-3 py-2">
					<span class="block text-[10px] font-bold text-zinc-400 uppercase">
						{t(lang, 'Kecepatan Target', 'Predicted Pace')}
					</span>
					<span class="font-extrabold text-zinc-900">
						{weeklyPlan.estimatedPagesPerDay ?? weeklyPlan.targetPagesPerDay} {t(lang, 'hlm/hari', 'pg/day')}
					</span>
				</div>
			</div>
		{:else}
			<div>
				<h2 class="text-base font-extrabold text-zinc-900">
					{t(lang, 'Rencanakan pekan bacamu', 'Plan your reading week')}
				</h2>
				<p class="mt-1 text-xs text-zinc-500 leading-relaxed">
					{t(lang, 'Pilih buku dari rakmu di bawah untuk membuat target halaman mingguan.', weeklyPlan.rationale)}
				</p>
			</div>
		{/if}

		<div class="pt-2">
			<button
				type="button"
				onclick={() => (showScheduleGenerator = !showScheduleGenerator)}
				class="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-extrabold text-zinc-700 transition-colors hover:bg-zinc-100"
			>
				<span>
					{showScheduleGenerator
						? t(lang, 'Sembunyikan Pengaturan Jadwal', 'Hide Schedule Generator')
						: t(lang, '✨ Atur / Buat Jadwal Baca', '✨ Customize / Generate Schedule')}
				</span>
			</button>
		</div>

		{#if showScheduleGenerator}
			<form onsubmit={handleGenerateSchedule} class="mt-3 space-y-3 border-t border-zinc-100 pt-3 text-xs">
				<div>
					<label for="sched-book" class="block font-bold text-zinc-700">
						{t(lang, 'Buku Fokus', 'Focus Book')}
					</label>
					{#if shelfQueue.length === 0}
						<p class="mt-1 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500">
							{t(lang, 'Belum ada buku aktif di rakmu — tambahkan dulu di bawah.', 'No active books on your shelf yet — add one below first.')}
						</p>
					{:else}
						<select
							id="sched-book"
							bind:value={selectedBookId}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900"
						>
							{#each shelfQueue as b (b.id)}
								<option value={b.id}>
									{b.title} ({Math.max(0, b.totalPages - b.currentPage)} {t(lang, 'hlm tersisa', 'pg left')})
								</option>
							{/each}
						</select>
					{/if}
				</div>

				<div>
					<label for="sched-pages" class="block font-bold text-zinc-700">
						{t(lang, 'Target Halaman Harian', 'Daily Target Pages')}
					</label>
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
					<span class="block font-bold text-zinc-700">
						{t(lang, 'Hari Baca Pilihan', 'Preferred Reading Days')}
					</span>
					<div class="mt-1.5 grid grid-cols-7 gap-1.5">
						{#each weekDayOptions as opt (opt.day)}
							{@const active = selectedDays.includes(opt.day)}
							<button
								type="button"
								onclick={() => togglePreferredDay(opt.day)}
								class="rounded-xl border-2 py-2 text-[11px] font-extrabold transition {active
									? 'border-accent bg-accent-subtle text-accent'
									: 'border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300'}"
							>
								{opt.label}
							</button>
						{/each}
					</div>
				</div>

				<div>
					<label for="gemini-key" class="block font-bold text-zinc-700">
						{t(lang, 'Kunci API Google Gemini', 'Google Gemini API Key')}
						<span class="font-normal text-zinc-400">
							{t(lang, '(opsional BYOK — tersimpan di browser)', '(optional BYOK — saved in browser)')}
						</span>
					</label>
					<input
						id="gemini-key"
						type="password"
						placeholder={t(lang, 'AIzaSy... (kosongkan untuk jadwal otomatis)', 'AIzaSy... (leave blank for built-in math planner)')}
						bind:value={geminiKey}
						class="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900"
					/>
				</div>

				<button
					type="submit"
					disabled={isGeneratingSchedule || shelfQueue.length === 0}
					class="flex min-h-[42px] w-full items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
				>
					{isGeneratingSchedule
						? t(lang, 'Menyusun Jadwal...', 'Generating Schedule...')
						: t(lang, 'Buat Jadwal Mingguan', 'Generate Weekly Schedule')}
				</button>
			</form>
		{/if}
	</section>

	<!-- Daily Schedule Breakdown -->
	<section class="space-y-3">
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-zinc-200"></div>
			<h2 class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
				{t(lang, 'Target Jadwal Harian', 'Daily Schedule Targets')}
			</h2>
			<div class="h-px flex-1 bg-zinc-200"></div>
		</div>

		{#if scheduleDays.length === 0}
			<div class="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-5 text-center text-xs font-semibold text-zinc-400">
				{t(lang, 'Buat jadwal di atas untuk memunculkan target harianmu.', 'Generate a schedule above to create your upcoming daily reading targets.')}
			</div>
		{:else}
			<div class="space-y-2">
				{#each scheduleDays as day (day.scheduleDayId)}
					<div class="flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-xs">
						<div>
							<span class="font-extrabold text-zinc-900">{day.dayName} • {day.bookTitle}</span>
							<p class="text-[11px] text-zinc-400">
								{day.scheduledDate} • {t(lang, 'Target', 'Target')}: {day.targetPages} {t(lang, 'halaman', 'pages')}
							</p>
						</div>
						<button
							type="button"
							disabled={busyDayId === day.scheduleDayId}
							onclick={() => handleToggleDayStatus(day.scheduleDayId, day.status)}
							title={t(lang, 'Ketuk untuk ubah status selesai/pending', 'Click to toggle completed/pending')}
							class="rounded-lg border px-2.5 py-1 text-[11px] font-extrabold uppercase transition disabled:opacity-50 {day.status === 'completed'
								? 'border-reward-muted bg-reward-subtle text-reward-text hover:opacity-80'
								: 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:border-accent hover:text-accent'}"
						>
							{day.status === 'completed'
								? t(lang, '✓ Selesai', '✓ Completed')
								: t(lang, 'Menunggu', day.status)}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Reading Queue & Shelf -->
	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
				{t(lang, 'Rak & Antrean Baca', 'Shelf & Concurrency Queue')}
			</h2>
			<button
				type="button"
				onclick={() => (showAddBook = !showAddBook)}
				class="rounded-xl border-2 border-zinc-200 bg-white px-3 py-1.5 text-xs font-extrabold text-accent transition-colors hover:bg-zinc-50"
			>
				{showAddBook ? t(lang, 'Batal', 'Cancel') : t(lang, '+ Tambah Buku', '+ Add Owned Book')}
			</button>
		</div>

		{#if showAddBook}
			<form onsubmit={handleAddBook} class="rounded-2xl border-2 border-zinc-200 bg-white p-4 space-y-3 text-xs">
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-extrabold text-zinc-900">
						{t(lang, 'Tambah Buku ke Rak', 'Add Owned Book to Shelf')}
					</h3>
					<span class="text-[11px] font-bold text-zinc-400">
						{activeReadingCount}/{maxConcurrent} {t(lang, 'slot aktif terpakai', 'active slots used')}
					</span>
				</div>

				<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
					<div>
						<label for="book-title-input" class="block font-bold text-zinc-700">{t(lang, 'Judul *', 'Title *')}</label>
						<input
							id="book-title-input"
							type="text"
							required
							placeholder={t(lang, 'mis. Filosofi Teras', 'e.g. The Psychology of Money')}
							bind:value={newTitle}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
						/>
					</div>
					<div>
						<label for="book-author-input" class="block font-bold text-zinc-700">{t(lang, 'Penulis *', 'Author *')}</label>
						<input
							id="book-author-input"
							type="text"
							required
							placeholder={t(lang, 'mis. Henry Manampiring', 'e.g. Morgan Housel')}
							bind:value={newAuthor}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
						/>
					</div>
					<div>
						<label for="book-publisher-input" class="block font-bold text-zinc-700">{t(lang, 'Penerbit', 'Publisher')}</label>
						<input
							id="book-publisher-input"
							type="text"
							placeholder={t(lang, 'mis. Penerbit Buku Kompas', 'e.g. Harriman House')}
							bind:value={newPublisher}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
						/>
					</div>
					<div>
						<label for="book-isbn-input" class="block font-bold text-zinc-700">{t(lang, 'ISBN-13 (13 digit)', 'ISBN-13 (13 digits)')}</label>
						<input
							id="book-isbn-input"
							type="text"
							maxlength="13"
							placeholder="9780857197689"
							bind:value={newIsbn13}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
						/>
					</div>
					<div>
						<label for="book-pages-input" class="block font-bold text-zinc-700">{t(lang, 'Total Halaman *', 'Total Pages *')}</label>
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
						<label for="book-status-input" class="block font-bold text-zinc-700">{t(lang, 'Status Awal', 'Initial Shelf Status')}</label>
						<select
							id="book-status-input"
							bind:value={newStatus}
							class="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold"
						>
							<option value="want_to_read">{t(lang, 'Rencana (Antrean)', 'Planned (Up Next)')}</option>
							<option value="reading" disabled={activeReadingCount >= maxConcurrent}>
								{t(lang, 'Sedang Dibaca', 'Reading Now')} {activeReadingCount >= maxConcurrent ? t(lang, '(Batas Penuh)', '(Max Limit Reached)') : ''}
							</option>
						</select>
					</div>
				</div>

				<button
					type="submit"
					disabled={isAddingBook}
					class="flex min-h-[42px] w-full items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
				>
					{isAddingBook ? t(lang, 'Menyimpan...', 'Adding Book...') : t(lang, 'Simpan ke Rak', 'Save Book to Shelf')}
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
							{book.author} • {book.currentPage}/{book.totalPages} {t(lang, 'halaman', 'pages')}
						</p>
					</div>
					{#if book.status === 'reading'}
						<span class="rounded-lg bg-accent-subtle px-2.5 py-1 text-[11px] font-extrabold text-accent uppercase">
							{t(lang, 'Dibaca', 'Reading')}
						</span>
					{:else if book.status === 'paused'}
						<span class="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700 uppercase">
							{t(lang, 'Jeda', 'Paused')}
						</span>
					{:else if book.status === 'dropped'}
						<span class="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-extrabold text-red-600 uppercase">
							{book.dropReason ? dropReasonLabels[book.dropReason] : t(lang, 'Berhenti', 'Dropped')}
						</span>
					{:else}
						<span class="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-extrabold text-zinc-500 uppercase">
							{t(lang, 'Rencana', 'Planned')}
						</span>
					{/if}
				</a>
			{/each}
		</div>
	</section>
</div>
