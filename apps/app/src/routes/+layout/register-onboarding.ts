import { toast } from '$lib/toast';
import { isTranscriptionServiceConfigured, getSelectedTranscriptionService } from '$lib/settings/transcription-validation';

/**
 * Checks if the user has configured the necessary API keys/settings for their selected transcription service.
 * Shows an onboarding toast if configuration is missing.
 */
export function registerOnboarding() {
	const selectedService = getSelectedTranscriptionService();
	
	if (!selectedService) {
		toast.info({
			title: 'Welcome to Whispering!',
			description: 'Please select a transcription service to get started.',
			action: {
				type: 'link',
				label: 'Configure',
				goto: '/settings/transcription'
			}
		});
		return;
	}

	if (!isTranscriptionServiceConfigured(selectedService)) {
		const missingConfig = selectedService.type === 'api' ? `${selectedService.name} API key` : `${selectedService.name} server URL`;
		
		toast.info({
			title: 'Welcome to Whispering!',
			description: `Please configure your ${missingConfig} to get started.`,
			action: {
				type: 'link',
				label: 'Configure',
				goto: '/settings/transcription'
			}
		});
	}
}