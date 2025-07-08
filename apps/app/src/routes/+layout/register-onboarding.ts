import { rpc } from '$lib/query';
import {
	getSelectedTranscriptionService,
	isTranscriptionServiceConfigured,
} from '$lib/settings/transcription-validation';

/**
 * Checks if the user has configured the necessary API keys/settings for their selected transcription service.
 * Shows an onboarding toast if configuration is missing.
 */
export function registerOnboarding() {
	const selectedService = getSelectedTranscriptionService();

	if (!selectedService) {
		rpc.notify.info.execute({
			title: 'Welcome to Whispering!',
			description: 'Please select a transcription service to get started.',
			action: {
				type: 'link',
				label: 'Configure',
				href: '/settings/transcription',
			},
			persist: true,
		});
		return;
	}

	if (!isTranscriptionServiceConfigured(selectedService)) {
		const missingConfig =
			selectedService.type === 'api'
				? `${selectedService.name} API key`
				: `${selectedService.name} server URL`;

		rpc.notify.info.execute({
			title: 'Welcome to Whispering!',
			description: `Please configure your ${missingConfig} to get started.`,
			action: {
				type: 'link',
				label: 'Configure',
				href: '/settings/transcription',
			},
			persist: true,
		});
	}
}
