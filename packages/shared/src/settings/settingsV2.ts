import { z } from 'zod';
import {
	ALWAYS_ON_TOP_VALUES,
	BITRATE_VALUES_KBPS,
	DEFAULT_BITRATE_KBPS,
	GROQ_MODELS,
	SUPPORTED_LANGUAGES,
	TRANSCRIPTION_SERVICES,
} from '../constants.js';
import type { SettingsV1 } from './settingsV1.js';

export const settingsV2Schema = z.object({
	'sound.playOn.start-manual': z.boolean(),
	'sound.playOn.stop-manual': z.boolean(),
	'sound.playOn.cancel-manual': z.boolean(),
	'sound.playOn.start-vad': z.boolean(),
	'sound.playOn.capture-vad': z.boolean(),
	'sound.playOn.stop-vad': z.boolean(),
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

export type SettingsV2 = z.infer<typeof settingsV2Schema>;

export const migrateV1ToV2 = (settings: SettingsV1) =>
	settingsV2Schema.parse({
		...settings,
		'sound.playOn.start-manual': true,
		'sound.playOn.stop-manual': true,
		'sound.playOn.cancel-manual': true,
		'sound.playOn.start-vad': true,
		'sound.playOn.capture-vad': true,
		'sound.playOn.stop-vad': true,
	} satisfies SettingsV2);
