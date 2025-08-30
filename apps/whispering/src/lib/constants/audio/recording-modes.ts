/**
 * Recording mode constants and options
 */

export const RECORDING_MODES = [
	'manual',
	'vad',
	'upload',
	// 'live',
	// 'cpal'
] as const;
export type RecordingMode = (typeof RECORDING_MODES)[number];

export const RECORDING_MODE_OPTIONS = [
	{ desktopOnly: false, icon: '🎙️', label: 'Manual', value: 'manual' },
	{ desktopOnly: false, icon: '🎤', label: 'Voice Activated', value: 'vad' },
	{ desktopOnly: false, icon: '📁', label: 'Upload File', value: 'upload' },
	// { label: 'Live', value: 'live', icon: '🎬', desktopOnly: false },
	// { label: 'CPAL', value: 'cpal', icon: '🔊', desktopOnly: true },
] as const satisfies {
	desktopOnly: boolean;
	icon: string;
	label: string;
	value: RecordingMode;
}[];
