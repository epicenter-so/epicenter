import { settings } from '$lib/stores/settings.svelte';
import { createOpenaiTranscriptionService } from './openai';
import { createGroqTranscriptionService } from './groq';
import { createFasterWhisperServerTranscriptionService } from './whisper/fasterWhisperServer';
import { createElevenLabsTranscriptionService } from './whisper/elevenlabs';
import { HttpServiceLive } from '$lib/services/http';

export type { TranscriptionService, TranscriptionServiceError } from './types';

// Dynamic service (settings-dependent, lazily loaded)
export function TranscriptionServiceLive() {
	switch (settings.value['transcription.selectedTranscriptionService']) {
		case 'OpenAI': {
			return createOpenaiTranscriptionService({
				HttpService: HttpServiceLive,
				apiKey: settings.value['apiKeys.openai'],
			});
		}
		case 'Groq': {
			return createGroqTranscriptionService({
				HttpService: HttpServiceLive,
				apiKey: settings.value['apiKeys.groq'],
				modelName: settings.value['transcription.groq.model'],
			});
		}
		case 'faster-whisper-server': {
			return createFasterWhisperServerTranscriptionService({
				HttpService: HttpServiceLive,
				serverModel:
					settings.value['transcription.fasterWhisperServer.serverModel'],
				serverUrl:
					settings.value['transcription.fasterWhisperServer.serverUrl'],
			});
		}
		case 'ElevenLabs': {
			return createElevenLabsTranscriptionService({
				apiKey: settings.value['apiKeys.elevenlabs'],
			});
		}
	}
}
