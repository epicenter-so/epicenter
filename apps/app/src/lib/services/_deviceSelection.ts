import { settings } from '$lib/stores/settings.svelte';

/**
 * Gets the selected audio input device ID based on the current recording method
 */
export function getSelectedDeviceId(): string | null {
	const method = settings.value['recording.method'];
	switch (method) {
		case 'navigator': {
			return settings.value['recording.navigator.selectedDeviceId'];
		}
		case 'tauri': {
			return settings.value['recording.tauri.selectedDeviceId'];
		}
	}
}

/**
 * Sets the selected audio input device ID based on the current recording method
 */
export function setSelectedDeviceId(deviceId: string | null): void {
	const method = settings.value['recording.method'];
	switch (method) {
		case 'navigator': {
			settings.value = {
				...settings.value,
				'recording.navigator.selectedDeviceId': deviceId,
			};
			break;
		}
		case 'tauri': {
			settings.value = {
				...settings.value,
				'recording.tauri.selectedDeviceId': deviceId,
			};
			break;
		}
	}
}
