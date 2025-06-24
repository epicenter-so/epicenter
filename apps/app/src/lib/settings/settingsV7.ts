import { type ZodBoolean, type ZodString, z } from 'zod';
import type { Command } from '$lib/commands';
import {
	ALWAYS_ON_TOP_VALUES,
	BITRATE_VALUES_KBPS,
	DEFAULT_BITRATE_KBPS,
	ELEVENLABS_TRANSCRIPTION_MODELS,
	GROQ_MODELS,
	OPENAI_TRANSCRIPTION_MODELS,
	RECORDING_MODES,
	SUPPORTED_LANGUAGES,
	TRANSCRIPTION_SERVICE_IDS,
	type WhisperingSoundNames,
} from '$lib/constants';
import type { SettingsV6 } from './settingsV6';

export const settingsV7Schema = z.object({
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
	'transcription.openai.model': z.enum(OPENAI_TRANSCRIPTION_MODELS),
	'transcription.elevenlabs.model': z.enum(ELEVENLABS_TRANSCRIPTION_MODELS),
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

export type SettingsV7 = z.infer<typeof settingsV7Schema>;

export const migrateV6ToV7 = (settings: SettingsV6): SettingsV7 => {
	// Destructure to separate out the old method-based structure
	const {
		'recording.mode': oldMode,
		'recording.manual.method': manualMethod,
		'recording.manual.navigator.selectedDeviceId': manualNavigatorDeviceId,
		'recording.manual.navigator.bitrateKbps': manualNavigatorBitrate,
		'recording.manual.tauri.selectedDeviceId': manualTauriDeviceId,
		'recording.vad.method': _vadMethod,
		'recording.vad.navigator.selectedDeviceId': vadNavigatorDeviceId,
		'recording.vad.navigator.bitrateKbps': vadNavigatorBitrate,
		'recording.live.method': _liveMethod,
		'recording.live.navigator.selectedDeviceId': liveNavigatorDeviceId,
		'recording.live.navigator.bitrateKbps': liveNavigatorBitrate,
		...restSettings
	} = settings;

	// Determine the new recording mode
	let newRecordingMode: 'manual' | 'cpal' | 'vad' | 'live' = 'manual';
	if (oldMode === 'manual' && manualMethod === 'tauri') {
		newRecordingMode = 'cpal';
	} else if (oldMode === 'vad') {
		newRecordingMode = 'vad';
	} else if (oldMode === 'live') {
		newRecordingMode = 'live';
	} else {
		newRecordingMode = 'manual';
	}

	return {
		...restSettings,
		'recording.mode': newRecordingMode,

		// Flattened device settings
		'recording.manual.selectedDeviceId': manualNavigatorDeviceId,
		'recording.manual.bitrateKbps': manualNavigatorBitrate,
		'recording.cpal.selectedDeviceId': manualTauriDeviceId,
		'recording.vad.selectedDeviceId': vadNavigatorDeviceId,
		'recording.live.selectedDeviceId': liveNavigatorDeviceId,
		'recording.live.bitrateKbps': liveNavigatorBitrate,

		// Add new sound settings for CPAL mode
		'sound.playOn.cpal-start': restSettings['sound.playOn.manual-start'],
		'sound.playOn.cpal-stop': restSettings['sound.playOn.manual-stop'],
		'sound.playOn.cpal-cancel': restSettings['sound.playOn.manual-cancel'],

		// Add new shortcuts for CPAL mode (copy from manual shortcuts)
		'shortcuts.local.toggleCpalRecording':
			restSettings['shortcuts.local.toggleManualRecording'],
		'shortcuts.local.cancelCpalRecording':
			restSettings['shortcuts.local.cancelManualRecording'],
		'shortcuts.global.toggleCpalRecording':
			restSettings['shortcuts.global.toggleManualRecording'],
		'shortcuts.global.cancelCpalRecording':
			restSettings['shortcuts.global.cancelManualRecording'],

		// Default model settings (carried over from V6 migration)
		'transcription.openai.model': 'whisper-1',
		'transcription.elevenlabs.model': 'scribe_v1',
		'transcription.groq.model': 'whisper-large-v3',
	};
};
