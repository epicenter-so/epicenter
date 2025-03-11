import { type ZodBoolean, type ZodString, z } from 'zod';
import type { Command } from '../commands.js';
import {
	ALWAYS_ON_TOP_VALUES,
	BITRATE_VALUES_KBPS,
	DEFAULT_BITRATE_KBPS,
	GROQ_MODELS,
	RECORDING_METHODS,
	SUPPORTED_LANGUAGES,
	TRANSCRIPTION_SERVICES,
	type WhisperingSoundNames,
} from '../constants.js';
import type { SettingsV4 } from './settingsV4.js';

export const settingsV5Schema = z.object({
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

	// Recording settings
	'recording.method': z.enum(RECORDING_METHODS).default('navigator'),

	// Navigator-specific recording settings
	'recording.navigator.selectedAudioInputDeviceId': z.string().nullable(),
	'recording.navigator.bitrateKbps': z
		.enum(BITRATE_VALUES_KBPS)
		.optional()
		.default(DEFAULT_BITRATE_KBPS),

	// Tauri-specific recording settings
	'recording.tauri.selectedAudioInputName': z.string().nullable(),

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

	...({
		'shortcuts.local.toggleManualRecording': z.string(),
		'shortcuts.local.cancelManualRecording': z.string(),
		'shortcuts.local.closeManualRecordingSession': z.string(),
		'shortcuts.local.toggleVadRecording': z.string(),
		'shortcuts.local.pushToTalk': z.string(),
	} satisfies Record<`shortcuts.local.${Command['id']}`, ZodString>),

	...({
		'shortcuts.global.toggleManualRecording': z.string(),
		'shortcuts.global.cancelManualRecording': z.string(),
		'shortcuts.global.closeManualRecordingSession': z.string(),
		'shortcuts.global.toggleVadRecording': z.string(),
		'shortcuts.global.pushToTalk': z.string(),
	} satisfies Record<`shortcuts.global.${Command['id']}`, ZodString>),
});

export type SettingsV5 = z.infer<typeof settingsV5Schema>;

export const migrateV4ToV5 = (settings: SettingsV4) =>
	settingsV5Schema.parse({
		...settings,
		'recording.method': 'navigator',
		'recording.navigator.selectedAudioInputDeviceId':
			settings['recording.selectedAudioInputDeviceId'],
		'recording.navigator.bitrateKbps': settings['recording.bitrateKbps'],
		'recording.tauri.selectedAudioInputName': null,
	} satisfies SettingsV5);
