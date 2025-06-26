import type { Command } from '$lib/commands';
import {
	ALWAYS_ON_TOP_VALUES,
	BITRATE_VALUES_KBPS,
	DEFAULT_BITRATE_KBPS,
	RECORDING_MODES,
	SUPPORTED_LANGUAGES,
	TRANSCRIPTION_SERVICE_IDS,
	type WhisperingSoundNames,
} from '$lib/constants';
import { type ZodBoolean, type ZodString, z } from 'zod';
import type { SettingsV7 } from './settingsV7';

export const settingsV8Schema = z.object({
	...({
		'sound.playOn.manual-start': z.boolean(),
		'sound.playOn.manual-stop': z.boolean(),
		'sound.playOn.manual-cancel': z.boolean(),
		'sound.playOn.cpal-start': z.boolean(),
		'sound.playOn.cpal-stop': z.boolean(),
		'sound.playOn.cpal-cancel': z.boolean(),
		'sound.playOn.vad-start': z.boolean(),
		'sound.playOn.vad-capture': z.boolean(),
		'sound.playOn.vad-stop': z.boolean(),
		'sound.playOn.transcriptionComplete': z.boolean(),
		'sound.playOn.transformationComplete': z.boolean(),
	} satisfies Record<
		`sound.playOn.${WhisperingSoundNames | 'cpal-start' | 'cpal-stop' | 'cpal-cancel'}`,
		ZodBoolean
	>),

	'transcription.clipboard.copyOnSuccess': z.boolean(),
	'transcription.clipboard.pasteOnSuccess': z.boolean(),
	'transformation.clipboard.copyOnSuccess': z.boolean(),
	'transformation.clipboard.pasteOnSuccess': z.boolean(),

	'system.closeToTray': z.boolean(),
	'system.alwaysOnTop': z.enum(ALWAYS_ON_TOP_VALUES),

	'database.recordingRetentionStrategy': z.enum([
		'keep-forever',
		'limit-count',
	] as const),
	'database.maxRecordingCount': z.string().regex(/^\d+$/, 'Must be a number'),

	// Recording mode settings - now includes 'cpal'
	'recording.mode': z.enum(RECORDING_MODES).default('manual'),

	// Manual mode settings (navigator only)
	'recording.manual.selectedDeviceId': z.string().nullable(),
	'recording.manual.bitrateKbps': z
		.enum(BITRATE_VALUES_KBPS)
		.optional()
		.default(DEFAULT_BITRATE_KBPS),

	// CPAL mode settings (native only)
	'recording.cpal.selectedDeviceId': z.string().nullable(),

	// VAD mode settings (navigator only)
	'recording.vad.selectedDeviceId': z.string().nullable(),

	// Live mode settings (navigator only)
	'recording.live.selectedDeviceId': z.string().nullable(),
	'recording.live.bitrateKbps': z
		.enum(BITRATE_VALUES_KBPS)
		.optional()
		.default(DEFAULT_BITRATE_KBPS),

	'transcription.selectedTranscriptionService': z.enum(
		TRANSCRIPTION_SERVICE_IDS,
	),
	// Shared settings in transcription
	'transcription.outputLanguage': z.enum(SUPPORTED_LANGUAGES),
	'transcription.prompt': z.string(),
	'transcription.temperature': z.string(),

	// Service-specific settings
	'transcription.openai.model': z.string(),
	'transcription.elevenlabs.model': z.string(),
	'transcription.groq.model': z.string(),
	'transcription.speaches.baseUrl': z.string(),
	'transcription.speaches.modelId': z.string(),

	'transformations.selectedTransformationId': z.string().nullable(),

	'apiKeys.openai': z.string(),
	'apiKeys.anthropic': z.string(),
	'apiKeys.groq': z.string(),
	'apiKeys.google': z.string(),
	'apiKeys.elevenlabs': z.string(),

	...({
		'shortcuts.local.toggleManualRecording': z.string().nullable(),
		'shortcuts.local.cancelManualRecording': z.string().nullable(),
		'shortcuts.local.toggleCpalRecording': z.string().nullable(),
		'shortcuts.local.cancelCpalRecording': z.string().nullable(),
		'shortcuts.local.toggleVadRecording': z.string().nullable(),
		'shortcuts.local.pushToTalk': z.string().nullable(),
	} satisfies Record<
		`shortcuts.local.${Command['id']}`,
		z.ZodNullable<ZodString>
	>),

	...({
		'shortcuts.global.toggleManualRecording': z.string().nullable(),
		'shortcuts.global.cancelManualRecording': z.string().nullable(),
		'shortcuts.global.toggleCpalRecording': z.string().nullable(),
		'shortcuts.global.cancelCpalRecording': z.string().nullable(),
		'shortcuts.global.toggleVadRecording': z.string().nullable(),
		'shortcuts.global.pushToTalk': z.string().nullable(),
	} satisfies Record<
		`shortcuts.global.${Command['id']}`,
		z.ZodNullable<ZodString>
	>),
});

export type SettingsV8 = z.infer<typeof settingsV8Schema>;

export const migrateV7ToV8 = (settings: SettingsV7): SettingsV8 => {
	// Destructure to separate out the old faster-whisper-server settings
	const {
		'transcription.fasterWhisperServer.serverUrl': fasterWhisperServerUrl,
		'transcription.fasterWhisperServer.serverModel': fasterWhisperServerModel,
		'transcription.selectedTranscriptionService': selectedService,
		...restSettings
	} = settings;

	// Migrate the service selection if it was faster-whisper-server
	const newSelectedService =
		selectedService === 'faster-whisper-server'
			? ('speaches' as const)
			: selectedService;

	return {
		...restSettings,
		'transcription.selectedTranscriptionService': newSelectedService,

		// Migrate faster-whisper-server settings to speaches with new naming
		'transcription.speaches.baseUrl':
			fasterWhisperServerUrl || 'http://localhost:8000',
		'transcription.speaches.modelId':
			fasterWhisperServerModel || 'Systran/faster-distil-whisper-small.en',
	};
};
