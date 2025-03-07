<script lang="ts">
	import { goto } from '$app/navigation';
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte';
	import FasterRerecordExplainedDialog from '$lib/components/FasterRerecordExplainedDialog.svelte';
	import MoreDetailsDialog from '$lib/components/MoreDetailsDialog.svelte';
	import NotificationLog from '$lib/components/NotificationLog.svelte';
	import { getRecorderFromContext } from '$lib/query/singletons/recorder';
	import { DbRecordingsService } from '$lib/services';
	import { settings } from '$lib/stores/settings.svelte';
	import { extension } from '@repo/extension';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { Toaster, type ToasterProps } from 'svelte-sonner';
	import { syncWindowAlwaysOnTopWithRecorderState } from './alwaysOnTop.svelte';
	import { closeToTrayIfEnabled } from './closeToTrayIfEnabled';
	import { syncIconWithRecorderState } from './syncIconWithRecorderState';

	const recorder = getRecorderFromContext();

	if (window.__TAURI_INTERNALS__) {
		syncWindowAlwaysOnTopWithRecorderState();
		syncIconWithRecorderState();
		closeToTrayIfEnabled();
	}

	$effect(() => {
		recorder.recorderState;
		void DbRecordingsService.cleanupExpiredRecordings(settings.value);
	});

	onMount(async () => {
		window.recorder = recorder;
		window.goto = goto;
		if (!window.__TAURI_INTERNALS__) {
			const _notifyWhisperingTabReadyResult =
				await extension.notifyWhisperingTabReady(undefined);
		}
	});

	const TOASTER_SETTINGS = {
		position: 'bottom-right',
		richColors: true,
		duration: 5000,
		visibleToasts: 5,
	} satisfies ToasterProps;

	let { children } = $props();
</script>

<button
	class="xxs:hidden hover:bg-accent hover:text-accent-foreground h-screen w-screen transform duration-300 ease-in-out"
	onclick={recorder.toggleRecording}
>
	<span
		style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));"
		class="text-[48px] leading-none"
	>
		{#if recorder.recorderState === 'SESSION+RECORDING'}
			⏹️
		{:else}
			🎙️
		{/if}
	</span>
</button>

<div class="xxs:flex hidden min-h-screen flex-col items-center gap-2">
	{@render children()}
</div>

<Toaster
	offset={16}
	class="xs:block hidden"
	theme={$mode}
	{...TOASTER_SETTINGS}
/>
<ModeWatcher />
<FasterRerecordExplainedDialog />
<ConfirmationDialog />
<MoreDetailsDialog />
<NotificationLog />
