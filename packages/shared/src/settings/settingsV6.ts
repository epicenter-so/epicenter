import { type ZodBoolean, type ZodString, z } from 'zod';
import type { Command } from '@repo/app/commands';
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
import type { SettingsV5 } from './settingsV5.js';

export const settingsV6Schema = z.object({
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
	// REMOVED: 'recording.isFasterRerecordEnabled': z.boolean(),

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
	'apiKeys.elevenlabs': z.string(),

	...({
		'shortcuts.local.toggleManualRecording': z.string().nullable(),
		'shortcuts.local.cancelManualRecording': z.string().nullable(),
		// REMOVED: 'shortcuts.local.closeManualRecordingSession': z.string().nullable(),
		'shortcuts.local.toggleVadRecording': z.string().nullable(),
		'shortcuts.local.pushToTalk': z.string().nullable(),
	} satisfies Record<
		`shortcuts.local.${Command['id']}`,
		z.ZodNullable<ZodString>
	>),

	...({
		'shortcuts.global.toggleManualRecording': z.string().nullable(),
		'shortcuts.global.cancelManualRecording': z.string().nullable(),
		// REMOVED: 'shortcuts.global.closeManualRecordingSession': z.string().nullable(),
		'shortcuts.global.toggleVadRecording': z.string().nullable(),
		'shortcuts.global.pushToTalk': z.string().nullable(),
	} satisfies Record<
		`shortcuts.global.${Command['id']}`,
		z.ZodNullable<ZodString>
	>),
});

export type SettingsV6 = z.infer<typeof settingsV6Schema>;

export const migrateV5ToV6 = (settings: SettingsV5): SettingsV6 => {
	// Remove the deprecated settings
	const { 
		'recording.isFasterRerecordEnabled': _removed1,
		'shortcuts.local.closeManualRecordingSession': _removed2,
		'shortcuts.global.closeManualRecordingSession': _removed3,
		...restSettings 
	} = settings;
	
	return settingsV6Schema.parse(restSettings);
};