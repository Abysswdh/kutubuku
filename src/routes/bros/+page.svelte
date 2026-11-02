<script lang="ts">
	import type { PageProps } from "./$types";
	import { invalidateAll } from "$app/navigation";
	import { toggleCelebrateBro } from "$lib/data/mock";

	let { data }: PageProps = $props();

	let updates = $derived(data.updates);

	async function handleCelebrate(id: string) {
		toggleCelebrateBro(id);
		await invalidateAll();
	}
</script>

<div class="space-y-5">
	<h1 class="text-xl font-extrabold tracking-tight text-zinc-900">
		Friend updates
	</h1>

	<!-- Duolingo-style section divider -->
	<div class="flex items-center gap-4">
		<div class="h-px flex-1 bg-zinc-200"></div>
		<span class="text-xs font-extrabold text-zinc-500">Earlier</span>
		<div class="h-px flex-1 bg-zinc-200"></div>
	</div>

	<!-- Friend Updates Feed -->
	<div class="space-y-3.5">
		{#each updates as item (item.id)}
			<article class="rounded-2xl border-2 border-zinc-200 bg-white p-4">
				<div class="flex items-start justify-between gap-4">
					<div class="space-y-2.5">
						<!-- User Header -->
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
								style="background-color: {item.avatarBg}"
								aria-hidden="true"
							>
								{item.avatarInitials}
							</div>
							<div>
								<h2
									class="text-sm font-extrabold text-zinc-900 leading-tight"
								>
									{item.userName}
								</h2>
								<p class="text-xs font-medium text-zinc-400">
									{item.timeAgo}
								</p>
							</div>
						</div>

						<!-- Update Text -->
						<p class="text-sm font-semibold text-zinc-800">
							{item.message}
						</p>
					</div>

					<!-- Right Illustration Badge -->
					<div
						class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-50 text-3xl"
						aria-hidden="true"
					>
						{item.badgeEmoji}
					</div>
				</div>

				<!-- Bottom Actions: Celebrate Button & Count -->
				<div class="mt-4 flex items-center justify-between">
					<div>
						{#if !item.hasCelebrated}
							<button
								type="button"
								onclick={() => handleCelebrate(item.id)}
								class="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-extrabold tracking-wider text-zinc-700 uppercase transition-colors hover:bg-zinc-50 active:translate-y-0.5"
							>
								<span aria-hidden="true">🎉</span>
								<span>Celebrate</span>
							</button>
						{:else}
							<button
								type="button"
								onclick={() => handleCelebrate(item.id)}
								class="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 border-accent/30 bg-accent-subtle px-3.5 py-1.5 text-xs font-extrabold tracking-wider text-accent uppercase transition-colors"
							>
								<span aria-hidden="true">🎉</span>
								<span>Celebrated</span>
							</button>
						{/if}
					</div>

					<div
						class="flex items-center gap-1.5 text-xs font-bold text-zinc-400"
					>
						<span
							class="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-xs"
							aria-hidden="true"
						>
							🎉
						</span>
						<span>{item.celebrations}</span>
					</div>
				</div>
			</article>
		{/each}
	</div>
</div>
