<script lang="ts">
	import { goto } from '$app/navigation';
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte';
	import MoreDetailsDialog from '$lib/components/MoreDetailsDialog.svelte';
	import NotificationLog from '$lib/components/NotificationLog.svelte';
	import { rpc } from '$lib/query';
	import { services } from '$lib/services';
	import { extension } from '@repo/extension';
	import { createQuery } from '@tanstack/svelte-query';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { Toaster, type ToasterProps } from 'svelte-sonner';
	import { syncWindowAlwaysOnTopWithRecorderState } from './alwaysOnTop.svelte';
	import { registerCommandsOnLoad } from './registerCommands.svelte';
	import { closeToTrayIfEnabled } from './closeToTrayIfEnabled';
	import { syncIconWithRecorderState } from './syncIconWithRecorderState.svelte';
	import { commandCallbacks } from '$lib/commands';

	const getRecorderStateQuery = createQuery(
		rpc.manualRecorder.getRecorderState.options,
	);
	const getVadStateQuery = createQuery(rpc.vadRecorder.getVadState.options);

	if (window.__TAURI_INTERNALS__) {
		syncWindowAlwaysOnTopWithRecorderState();
		syncIconWithRecorderState();
		closeToTrayIfEnabled();
	}

	registerCommandsOnLoad();

	$effect(() => {
		getRecorderStateQuery.data;
		getVadStateQuery.data;
		services.db.cleanupExpiredRecordings();
	});

	onMount(async () => {
		window.commands = commandCallbacks;
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
		toastOptions: {
			classes: {
				toast: 'flex flex-wrap [&>[data-content]]:flex-1',
				icon: 'flex-shrink-0',
				actionButton: 'w-full mt-3 inline-flex justify-center',
			},
		},
	} satisfies ToasterProps;

	let { children } = $props();
</script>

<button
	class="xxs:hidden hover:bg-accent hover:text-accent-foreground h-screen w-screen transform duration-300 ease-in-out"
	onclick={commandCallbacks.toggleManualRecording}
>
	<span
		style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));"
		class="text-[48px] leading-none"
	>
		{#if getRecorderStateQuery.data === 'RECORDING'}
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
	theme={mode.current}
	{...TOASTER_SETTINGS}
/>
<ModeWatcher />
<ConfirmationDialog />
<MoreDetailsDialog />
<NotificationLog />
