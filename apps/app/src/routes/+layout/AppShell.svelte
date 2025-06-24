<script lang="ts">
	import { goto } from '$app/navigation';
	import { commandCallbacks } from '$lib/commands';
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte';
	import MoreDetailsDialog from '$lib/components/MoreDetailsDialog.svelte';
	import NotificationLog from '$lib/components/NotificationLog.svelte';
	import UpdateDialog, {
		updateDialog,
	} from '$lib/components/UpdateDialog.svelte';
	import { rpc } from '$lib/query';
	import * as services from '$lib/services';
	import { extractErrorMessage } from '@epicenterhq/result';
	// import { extension } from '@repo/extension';
	import { createQuery } from '@tanstack/svelte-query';
	import { relaunch } from '@tauri-apps/plugin-process';
	import { check } from '@tauri-apps/plugin-updater';

	import { ModeWatcher, mode } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { Toaster, type ToasterProps, toast } from 'svelte-sonner';
	import { syncWindowAlwaysOnTopWithRecorderState } from './alwaysOnTop.svelte';
	import { closeToTrayIfEnabled } from './closeToTrayIfEnabled';
	import {
		resetShortcutsDoDefaultIfDuplicates,
		syncGlobalShortcutsWithSettings,
		syncLocalShortcutsWithSettings,
	} from './registerCommands.svelte';
	import { syncIconWithRecorderState } from './syncIconWithRecorderState.svelte';
	import { mockCheck, shouldUseMockUpdates } from './mock-check';

	const getRecorderStateQuery = createQuery(
		rpc.manualRecorder.getRecorderState.options,
	);
	const getVadStateQuery = createQuery(rpc.vadRecorder.getVadState.options);

	onMount(() => {
		window.commands = commandCallbacks;
		window.goto = goto;
		syncLocalShortcutsWithSettings();
		if (window.__TAURI_INTERNALS__) {
			syncGlobalShortcutsWithSettings();
			resetShortcutsDoDefaultIfDuplicates();
			checkForUpdates();
		} else {
			// const _notifyWhisperingTabReadyResult =
			// await extension.notifyWhisperingTabReady(undefined);
		}
	});

	async function checkForUpdates() {
		try {
			// Use mock or real check based on configuration
			const update = await (shouldUseMockUpdates() ? mockCheck() : check());
			if (update) {
				toast.info(`Update ${update.version} available`, {
					action: {
						label: 'View Update',
						onClick: () => updateDialog.open(update),
					},
				});
			}
		} catch (error) {
			toast.error('Failed to check for updates', {
				description: extractErrorMessage(error),
			});
		}
	}

	closeToTrayIfEnabled();

	if (window.__TAURI_INTERNALS__) {
		syncWindowAlwaysOnTopWithRecorderState();
		syncIconWithRecorderState();
	}

	$effect(() => {
		getRecorderStateQuery.data;
		getVadStateQuery.data;
		services.db.cleanupExpiredRecordings();
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
				closeButton: 'w-full mt-3 inline-flex justify-center',
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
<UpdateDialog />
