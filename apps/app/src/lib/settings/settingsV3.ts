import {
	ALWAYS_ON_TOP_VALUES,
	BITRATE_VALUES_KBPS,
	DEFAULT_BITRATE_KBPS,
	SUPPORTED_LANGUAGES,
} from '$lib/constants';
import { type ZodBoolean, z } from 'zod';
import type { SettingsV2 } from './settingsV2';

export const settingsV3Schema = z.object({
	'sound.playOn.manual-start': z.boolean(),
	'sound.playOn.manual-stop': z.boolean(),
	'sound.playOn.manual-cancel': z.boolean(),
	'sound.playOn.vad-start': z.boolean(),
	'sound.playOn.vad-capture': z.boolean(),
	'sound.playOn.vad-stop': z.boolean(),
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
	'transcription.selectedTranscriptionService': z.enum([
		'OpenAI',
		'Groq',
		'faster-whisper-server',
		'ElevenLabs',
	]),
	'transcription.outputLanguage': z.enum(SUPPORTED_LANGUAGES),
	'transcription.prompt': z.string(),
	'transcription.temperature': z.string(),

	// Service-specific settings
	'transcription.groq.model': z.string(),
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

export type SettingsV3 = z.infer<typeof settingsV3Schema>;

export const migrateV2ToV3 = (settings: SettingsV2) =>
	({
		...settings,
		'sound.playOn.manual-start': true,
		'sound.playOn.manual-stop': true,
		'sound.playOn.manual-cancel': true,
		'sound.playOn.vad-start': true,
		'sound.playOn.vad-capture': true,
		'sound.playOn.vad-stop': true,
	}) satisfies SettingsV3;
