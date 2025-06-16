import { type ZodBoolean, type ZodString, z } from 'zod';
import type { Command } from '@repo/app/commands';
import {
	ALWAYS_ON_TOP_VALUES,
	BITRATE_VALUES_KBPS,
	DEFAULT_BITRATE_KBPS,
	GROQ_MODELS,
	MANUAL_RECORDING_METHODS,
	RECORDING_MODES,
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

	// Recording mode settings
	'recording.mode': z.enum(RECORDING_MODES).default('manual'),

	// Mode-specific method settings
	'recording.manual.method': z
		.enum(MANUAL_RECORDING_METHODS)
		.default('navigator'),
	// Manual mode method-specific settings
	'recording.manual.navigator.selectedDeviceId': z.string().nullable(),
	'recording.manual.navigator.bitrateKbps': z
		.enum(BITRATE_VALUES_KBPS)
		.optional()
		.default(DEFAULT_BITRATE_KBPS),
	'recording.manual.tauri.selectedDeviceId': z.string().nullable(),

	// VAD mode method-specific settings (navigator only)
	'recording.vad.method': z.enum(['navigator']).default('navigator'),
	// VAD mode method-specific settings (navigator only)
	'recording.vad.navigator.selectedDeviceId': z.string().nullable(),
	'recording.vad.navigator.bitrateKbps': z
		.enum(BITRATE_VALUES_KBPS)
		.optional()
		.default(DEFAULT_BITRATE_KBPS),

	// Live mode method-specific settings
	'recording.live.method': z.enum(['navigator']).default('navigator'),
	// Live mode method-specific settings
	'recording.live.navigator.selectedDeviceId': z.string().nullable(),
	'recording.live.navigator.bitrateKbps': z
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
		'recording.tauri.selectedAudioInputName': tauriSelectedDeviceId,
		'recording.navigator.selectedAudioInputDeviceId': navigatorSelectedDeviceId,
		'recording.navigator.bitrateKbps': navigatorBitrateKbps,
		'recording.method': oldMethod,
		...restSettings
	} = settings;

	return {
		...restSettings,
		// Default to manual mode
		'recording.mode': 'manual',

		// Set method for each mode based on old method preference
		'recording.manual.method': oldMethod ?? 'navigator',
		'recording.vad.method': 'navigator', // VAD only supports navigator
		'recording.live.method': 'navigator', // Live only supports navigator

		// Migrate navigator settings to all modes that support it
		'recording.manual.navigator.selectedDeviceId': navigatorSelectedDeviceId,
		'recording.manual.navigator.bitrateKbps': navigatorBitrateKbps,
		'recording.manual.tauri.selectedDeviceId': tauriSelectedDeviceId,

		'recording.vad.navigator.selectedDeviceId': navigatorSelectedDeviceId,
		'recording.vad.navigator.bitrateKbps': navigatorBitrateKbps,

		'recording.live.navigator.selectedDeviceId': navigatorSelectedDeviceId,
		'recording.live.navigator.bitrateKbps': navigatorBitrateKbps,
	};
};
