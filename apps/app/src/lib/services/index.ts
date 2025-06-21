import { settings } from '../stores/settings.svelte';
import {
	createSetTrayIconDesktopService,
	createSetTrayIconWebService,
} from './SetTrayIconService';
import { createClipboardServiceDesktop } from './clipboard/desktop';
import { createClipboardServiceWeb } from './clipboard/web';
import { createDbServiceDexie } from './db/dexie';
import { createDownloadServiceDesktop } from './download/desktop';
import { createDownloadServiceWeb } from './download/web';
import { createHttpServiceDesktop } from './http/desktop';
import { createHttpServiceWeb } from './http/web';
import { createNotificationServiceDesktop } from './notifications/desktop';
import { createNotificationServiceWeb } from './notifications/web';
import { createCpalRecorderService } from './cpalRecorder';
import { createManualRecorderService } from './manualRecorder';
import { createPlaySoundServiceDesktop } from './sound/desktop';
import { createPlaySoundServiceWeb } from './sound/web';
import { createElevenLabsTranscriptionService } from './transcription/whisper/elevenlabs';
import { createFasterWhisperServerTranscriptionService } from './transcription/whisper/fasterWhisperServer';
import { createGroqTranscriptionService } from './transcription/whisper/groq';
import { createOpenaiTranscriptionService } from './transcription/whisper/openai';
import { createTransformerService } from './transformer';
import { createVadServiceWeb } from './vad';
import { createGlobalShortcutManager } from './shortcuts/createGlobalShortcutManager';
import { createLocalShortcutManager } from './shortcuts/createLocalShortcutManager';
import { createOsServiceDesktop } from './os/desktop';
import { createOsServiceWeb } from './os/web';
import type { Settings } from '$lib/settings';

// Static services (platform-dependent but not settings-dependent)
const DownloadService = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktop()
	: createDownloadServiceWeb();

const NotificationService = window.__TAURI_INTERNALS__
	? createNotificationServiceDesktop()
	: createNotificationServiceWeb();

const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop()
	: createClipboardServiceWeb();

const SetTrayIconService = window.__TAURI_INTERNALS__
	? createSetTrayIconDesktopService()
	: createSetTrayIconWebService();

const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktop()
	: createHttpServiceWeb();

const PlaySoundService = window.__TAURI_INTERNALS__
	? createPlaySoundServiceDesktop()
	: createPlaySoundServiceWeb();

const OsService = window.__TAURI_INTERNALS__
	? createOsServiceDesktop()
	: createOsServiceWeb();

// Static services (platform-agnostic)
const VadService = createVadServiceWeb();

const DbService = createDbServiceDexie({ DownloadService });

const TransformerService = createTransformerService({ HttpService, DbService });

const NavigatorRecorderService = createManualRecorderService();
const CpalRecorderService = createCpalRecorderService();

const LocalShortcutManager = createLocalShortcutManager();
const GlobalShortcutManager = createGlobalShortcutManager();

// Dynamic services (settings-dependent, lazily loaded)
function TranscriptionService() {
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
	}
}

/**
 * Unified services object providing consistent access to all services.
 */
export {
	ClipboardService as clipboard,
	DownloadService as download,
	NotificationService as notification,
	SetTrayIconService as setTrayIcon,
	VadService as vad,
	DbService as db,
	TransformerService as transformer,
	TranscriptionService as transcription,
	NavigatorRecorderService as manualRecorder,
	CpalRecorderService as cpalRecorder,
	PlaySoundService as sound,
	LocalShortcutManager as localShortcutManager,
	GlobalShortcutManager as globalShortcutManager,
	OsService as os,
};
