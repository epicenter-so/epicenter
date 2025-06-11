import type { RECORDING_METHODS, WhisperingSoundNames } from '@repo/shared';
import { settings } from '../stores/settings.svelte';
import {
	createSetTrayIconDesktopService,
	createSetTrayIconWebService,
} from './SetTrayIconService';
import { createClipboardServiceDesktop } from './clipboard/desktop';
import { createClipboardServiceWeb } from './clipboard/web';
import {
	createDbRecordingsServiceDexie,
	createDbTransformationsServiceDexie,
} from './db/DbService.dexie';
import { createDownloadServiceDesktop } from './download/desktop';
import { createDownloadServiceWeb } from './download/web';
import { createHttpServiceDesktop } from './http/desktop';
import { createHttpServiceWeb } from './http/web';
import { createNotificationServiceDesktop } from './notifications/desktop';
import { createNotificationServiceWeb } from './notifications/web';
import type { RecorderService } from './recorder/_types';
import { createRecorderServiceTauri } from './recorder/tauri';
import { createRecorderServiceWeb } from './recorder/web';
import { createTransformerService } from './transformer';
import { createPlaySoundServiceDesktop } from './sound/desktop';
import { createPlaySoundServiceWeb } from './sound/web';
import { createElevenLabsTranscriptionService } from './transcription/whisper/elevenlabs';
import { createFasterWhisperServerTranscriptionService } from './transcription/whisper/fasterWhisperServer';
import { createGroqTranscriptionService } from './transcription/whisper/groq';
import { createOpenaiTranscriptionService } from './transcription/whisper/openai';
import { createVadServiceWeb } from './vad';

export const DownloadService = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktop()
	: createDownloadServiceWeb();

export const NotificationService = window.__TAURI_INTERNALS__
	? createNotificationServiceDesktop()
	: createNotificationServiceWeb();

export const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop()
	: createClipboardServiceWeb();

export const SetTrayIconService = window.__TAURI_INTERNALS__
	? createSetTrayIconDesktopService()
	: createSetTrayIconWebService();

export const DbRecordingsService = createDbRecordingsServiceDexie({
	DownloadService,
});
export const DbTransformationsService = createDbTransformationsServiceDexie({
	DownloadService,
});

const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktop()
	: createHttpServiceWeb();

const PlaySoundService = window.__TAURI_INTERNALS__
	? createPlaySoundServiceDesktop()
	: createPlaySoundServiceWeb();

export const TransformerService = createTransformerService({
	HttpService,
	DbTransformationsService,
});

export const VadService = createVadServiceWeb();

/**
 * Services that are determined by the user's settings.
 */
export const services = (() => {
	const RecorderServiceTauri = createRecorderServiceTauri();
	const RecorderServiceWeb = createRecorderServiceWeb();

	return {
		get transcription() {
			switch (settings.value['transcription.selectedTranscriptionService']) {
				case 'OpenAI': {
					return createOpenaiTranscriptionService({
						HttpService,
						apiKey: settings.value['apiKeys.openai'],
					});
				}
				case 'Groq': {
					return createGroqTranscriptionService({
						HttpService,
						apiKey: settings.value['apiKeys.groq'],
						modelName: settings.value['transcription.groq.model'],
					});
				}
				case 'faster-whisper-server': {
					return createFasterWhisperServerTranscriptionService({
						HttpService,
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
				default: {
					return createOpenaiTranscriptionService({
						HttpService,
						apiKey: settings.value['apiKeys.openai'],
					});
				}
			}
		},
		get recorder() {
			const recorderServices = {
				tauri: RecorderServiceTauri,
				navigator: RecorderServiceWeb,
			} satisfies Record<(typeof RECORDING_METHODS)[number], RecorderService>;
			const recordingMethod = settings.value['recording.method'];
			return recorderServices[recordingMethod];
		},
		get download() {
			return DownloadService;
		},
	};
})();

export const playSoundIfEnabled = (soundName: WhisperingSoundNames) => {
	if (settings.value[`sound.playOn.${soundName}`]) {
		PlaySoundService.playSound(soundName);
	}
};
