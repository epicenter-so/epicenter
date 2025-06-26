import { settings } from '$lib/stores/settings.svelte';
import { createOpenaiTranscriptionService } from './openai';
import { createGroqTranscriptionService } from './groq';
import { createSpeachesTranscriptionService } from './speaches';
import { createElevenLabsTranscriptionService } from './elevenlabs';
import { HttpServiceLive } from '$lib/services/http';

export type { TranscriptionService, TranscriptionServiceError } from './types';

// Dynamic service (settings-dependent, lazily loaded)
export function TranscriptionServiceLive() {
	switch (settings.value['transcription.selectedTranscriptionService']) {
		case 'OpenAI': {
			return createOpenaiTranscriptionService({
				apiKey: settings.value['apiKeys.openai'],
			});
		}
		case 'Groq': {
			return createGroqTranscriptionService({
				apiKey: settings.value['apiKeys.groq'],
				modelName: settings.value['transcription.groq.model'],
			});
		}
		case 'speaches': {
			return createSpeachesTranscriptionService({
				HttpService: HttpServiceLive,
				modelId: settings.value['transcription.speaches.modelId'],
				baseUrl: settings.value['transcription.speaches.baseUrl'],
			});
		}
		case 'ElevenLabs': {
			return createElevenLabsTranscriptionService({
				apiKey: settings.value['apiKeys.elevenlabs'],
			});
		}
	}
}
