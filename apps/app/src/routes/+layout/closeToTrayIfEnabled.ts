import { settings } from '$lib/stores/settings.svelte';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { exit } from '@tauri-apps/plugin-process';
import { onDestroy, onMount } from 'svelte';

export function closeToTrayIfEnabled() {
	let unlisten: UnlistenFn;
	onMount(async () => {
		unlisten = await getCurrentWindow().onCloseRequested(async (event) => {
			if (settings.value['system.closeToTray']) {
				event.preventDefault();
				getCurrentWindow().hide();
			}
		});
	});

	onDestroy(() => {
		unlisten();
	});
}
