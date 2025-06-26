import type { Command } from '$lib/commands';
import {
	ALWAYS_ON_TOP_VALUES,
	BITRATE_VALUES_KBPS,
	DEFAULT_BITRATE_KBPS,
	SUPPORTED_LANGUAGES,
	TRANSCRIPTION_SERVICE_IDS,
	type WhisperingSoundNames,
} from '$lib/constants';
import { type ZodBoolean, type ZodString, z } from 'zod';
import type { SettingsV3 } from './settingsV3';

export const settingsV4Schema = z.object({
	...({
		'sound.playOn.manual-start': z.boolean(),
		'sound.playOn.manual-stop': z.boolean(),
		'sound.playOn.manual-cancel': z.boolean(),
		'sound.playOn.vad-start': z.boolean(),
		'sound.playOn.vad-capture': z.boolean(),
		'sound.playOn.vad-stop': z.boolean(),
		'sound.playOn.transcriptionComplete': z.boolean(),
		'sound.playOn.transformationComplete': z.boolean(),
	} satisfies Record<`sound.playOn.${WhisperingSoundNames}`, ZodBoolean>),

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

	...({
		'shortcuts.local.toggleManualRecording': z.string(),
		'shortcuts.local.cancelManualRecording': z.string(),
		'shortcuts.local.toggleVadRecording': z.string(),
		'shortcuts.local.pushToTalk': z.string(),
	} satisfies Record<`shortcuts.local.${Command['id']}`, ZodString>),

	...({
		'shortcuts.global.toggleManualRecording': z.string(),
		'shortcuts.global.cancelManualRecording': z.string(),
		'shortcuts.global.toggleVadRecording': z.string(),
		'shortcuts.global.pushToTalk': z.string(),
	} satisfies Record<`shortcuts.global.${Command['id']}`, ZodString>),
});

export type SettingsV4 = z.infer<typeof settingsV4Schema>;

export const migrateV3ToV4 = (settings: SettingsV3) =>
	({
		...settings,
		'shortcuts.local.toggleManualRecording':
			settings['shortcuts.currentLocalShortcut'],
		'shortcuts.local.cancelManualRecording': 'c',
		'shortcuts.local.toggleVadRecording': 'v',
		'shortcuts.local.pushToTalk': 'p',
		'shortcuts.global.toggleManualRecording':
			settings['shortcuts.currentGlobalShortcut'],
		'shortcuts.global.cancelManualRecording': "CommandOrControl+Shift+'",
		'shortcuts.global.toggleVadRecording': '',
		'shortcuts.global.pushToTalk': '',
	}) satisfies SettingsV4;
