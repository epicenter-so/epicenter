import { settings } from '$lib/stores/settings.svelte';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { onDestroy, onMount } from 'svelte';

export function closeToTrayIfEnabled() {
	let unlisten: UnlistenFn | undefined;
	onMount(async () => {
		if (!window.__TAURI_INTERNALS__) return;
		const { getCurrentWindow } = await import('@tauri-apps/api/window');
		unlisten = await getCurrentWindow().onCloseRequested(async (event) => {
			if (settings.value['system.closeToTray']) {
				event.preventDefault();
				getCurrentWindow().hide();
			}
		});
	});

	onDestroy(() => {
		if (!unlisten) return;
		unlisten();
	});
}
