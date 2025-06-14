import { settings } from '$lib/stores/settings.svelte';

/**
 * Gets the selected audio input device ID based on the current recording method
 */
export function getSelectedAudioInputDeviceId(): string | null {
	const method = settings.value['recording.method'];
	switch (method) {
		case 'navigator': {
			return settings.value['recording.navigator.selectedAudioInputDeviceId'];
		}
		case 'tauri': {
			return settings.value['recording.tauri.selectedAudioInputDeviceId'];
		}
	}
}

/**
 * Sets the selected audio input device ID based on the current recording method
 */
export function setSelectedAudioInputDeviceId(deviceId: string | null): void {
	const method = settings.value['recording.method'];
	switch (method) {
		case 'navigator': {
			settings.value = {
				...settings.value,
				'recording.navigator.selectedAudioInputDeviceId': deviceId,
			};
			break;
		}
		case 'tauri': {
			settings.value = {
				...settings.value,
				'recording.tauri.selectedAudioInputDeviceId': deviceId,
			};
			break;
		}
	}
}