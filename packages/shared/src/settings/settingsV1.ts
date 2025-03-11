import { z } from 'zod';
import {
	ALWAYS_ON_TOP_VALUES,
	BITRATE_VALUES_KBPS,
	DEFAULT_BITRATE_KBPS,
	GROQ_MODELS,
	SUPPORTED_LANGUAGES,
	TRANSCRIPTION_SERVICES,
} from '../constants.js';

export const settingsV1Schema = z.object({
	'sound.playOn.start': z.boolean(),
	'sound.playOn.stop': z.boolean(),
	'sound.playOn.cancel': z.boolean(),
	'sound.playOn.transcriptionComplete': z.boolean(),
	'sound.playOn.transformationComplete': z.boolean(),

	'transcription.clipboard.copyOnSuccess': z.boolean(),
	'transcription.clipboard.pasteOnSuccess': z.boolean(),
	'transformation.clipboard.copyOnSuccess': z.boolean(),
	'transformation.clipboard.pasteOnSuccess': z.boolean(),
	'recording.isFasterRerecordEnabled': z.boolean(),

	'system.closeToTray': z.boolean(),
	'system.alwaysOnTop': z.enum(ALWAYS_ON_TOP_VALUES),

	'database.recordingRetentionStrategy': z.enum([
		'keep-forever',
		'limit-count',
	] as const),
	'database.maxRecordingCount': z.string().regex(/^\d+$/, 'Must be a number'),

	'recording.selectedAudioInputDeviceId': z.string().nullable(),
	'recording.bitrateKbps': z
		.enum(BITRATE_VALUES_KBPS)
		.optional()
		.default(DEFAULT_BITRATE_KBPS),

	// Shared transcription settings
	'transcription.selectedTranscriptionService': z.enum(TRANSCRIPTION_SERVICES),
	'transcription.outputLanguage': z.enum(SUPPORTED_LANGUAGES),
	'transcription.prompt': z.string(),
	'transcription.temperature': z.string(),

	// Service-specific settings
	'transcription.groq.model': z.enum(GROQ_MODELS),
	'transcription.fasterWhisperServer.serverUrl': z.string(),
	'transcription.fasterWhisperServer.serverModel': z.string(),

	'transformations.selectedTransformationId': z.string().nullable(),

	'apiKeys.openai': z.string(),
	'apiKeys.anthropic': z.string(),
	'apiKeys.groq': z.string(),
	'apiKeys.google': z.string(),

	'shortcuts.currentLocalShortcut': z.string(),
	'shortcuts.currentGlobalShortcut': z.string(),
});

export type SettingsV1 = z.infer<typeof settingsV1Schema>;

export const getDefaultSettingsV1 = () =>
	({
		'sound.playOn.start': true,
		'sound.playOn.stop': true,
		'sound.playOn.cancel': true,
		'sound.playOn.transcriptionComplete': true,
		'sound.playOn.transformationComplete': true,
		'transcription.clipboard.copyOnSuccess': true,
		'transcription.clipboard.pasteOnSuccess': true,
		'transformation.clipboard.copyOnSuccess': true,
		'transformation.clipboard.pasteOnSuccess': true,
		'recording.isFasterRerecordEnabled': false,
		'system.closeToTray': false,
		'system.alwaysOnTop': 'Never',

		// Recording retention defaults
		'database.recordingRetentionStrategy': 'keep-forever',
		'database.maxRecordingCount': '5',

		'recording.selectedAudioInputDeviceId': 'default',
		'recording.bitrateKbps': DEFAULT_BITRATE_KBPS,

		'transcription.selectedTranscriptionService': 'OpenAI',
		'transcription.groq.model': 'whisper-large-v3',
		'transcription.outputLanguage': 'auto',
		'transcription.prompt': '',
		'transcription.temperature': '0',

		'transcription.fasterWhisperServer.serverUrl': 'http://localhost:8000',
		'transcription.fasterWhisperServer.serverModel':
			'Systran/faster-whisper-medium.en',

		'transformations.selectedTransformationId': null,

		'apiKeys.openai': '',
		'apiKeys.anthropic': '',
		'apiKeys.groq': '',
		'apiKeys.google': '',

		'shortcuts.currentLocalShortcut': 'space',
		'shortcuts.currentGlobalShortcut': 'CommandOrControl+Shift+;',
	}) satisfies SettingsV1;
