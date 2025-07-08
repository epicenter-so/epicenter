import {
	TRANSCRIPTION_SERVICES,
	type TranscriptionService,
} from '$lib/constants/transcription';
import { settings } from '$lib/stores/settings.svelte';

/**
 * Gets the currently selected transcription service.
 *
 * @returns The selected transcription service, or undefined if none selected or invalid
 */
export function getSelectedTranscriptionService():
	| TranscriptionService
	| undefined {
	const selectedServiceId =
		settings.value['transcription.selectedTranscriptionService'];
	return TRANSCRIPTION_SERVICES.find((s) => s.id === selectedServiceId);
}

/**
 * Checks if a transcription service has all required configuration.
 *
 * @param service - The transcription service to check
 * @param settings - The current settings object
 * @returns true if the service is properly configured, false otherwise
 */
export function isTranscriptionServiceConfigured(
	service: TranscriptionService,
): boolean {
	switch (service.type) {
		case 'api': {
			const apiKey = settings.value[service.apiKeyField];
			return apiKey !== '';
		}
		case 'server': {
			const url = settings.value[service.serverUrlField];
			return url !== '';
		}
		default: {
			return true;
		}
	}
}
