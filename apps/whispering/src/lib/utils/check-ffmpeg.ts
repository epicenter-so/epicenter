import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';
import { rpc } from '$lib/query';
import { settings } from '$lib/stores/settings.svelte';

/**
 * Checks if Whisper C++ is selected as the transcription service
 * @returns true if using Whisper C++ for transcription
 */
function isUsingWhisperCpp(): boolean {
	return (
		settings.value['transcription.selectedTranscriptionService'] ===
		'whispercpp'
	);
}

/**
 * Checks if the native (Rust) recording backend is selected
 * @returns true if using native backend for recording
 */
function isUsingNativeBackend(): boolean {
	return settings.value['recording.backend'] === 'native';
}

/**
 * Checks if the browser (MediaRecorder) recording backend is selected
 * @returns true if using browser backend for recording
 */
function isUsingBrowserBackend(): boolean {
	return settings.value['recording.backend'] === 'browser';
}

/**
 * Checks if the sample rate is set to 16kHz
 * Note: Whisper C++ requires 16kHz audio input
 * @returns true if sample rate is 16000Hz
 */
function isUsing16kHz(): boolean {
	return settings.value['recording.desktop.sampleRate'] === '16000';
}

/**
 * Checks if FFmpeg is REQUIRED for Whisper C++ with browser recording
 * Browser backend cannot produce 16kHz WAV directly, so FFmpeg is required
 * @returns true if using Whisper C++ with browser backend
 */
export function isUsingWhisperCppWithBrowserBackend(): boolean {
	return isUsingWhisperCpp() && isUsingBrowserBackend();
}

/**
 * Checks if FFmpeg is REQUIRED for Whisper C++ with wrong sample rate
 * Native backend with non-16kHz audio needs FFmpeg to convert for Whisper C++
 * @returns true if using Whisper C++ with native backend at non-16kHz
 */
export function isUsingNativeBackendAtWrongSampleRate(): boolean {
	return isUsingWhisperCpp() && isUsingNativeBackend() && !isUsing16kHz();
}

/**
 * Checks if FFmpeg would benefit cloud transcription with native backend
 * FFmpeg enables audio compression for faster uploads to cloud services
 * Only relevant when using native backend with cloud providers (not Whisper C++)
 * @returns true if using native backend with any cloud transcription service
 */
export function isUsingNativeBackendWithCloudTranscription(): boolean {
	return isUsingNativeBackend() && !isUsingWhisperCpp();
}

/**
 * Checks for FFmpeg installation and shows an appropriate toast based on current settings.
 *
 * FFmpeg is REQUIRED when:
 * - Using Whisper C++ with browser recording backend
 * - Using Whisper C++ with native recording backend at any sample rate other than 16kHz
 *
 * FFmpeg is RECOMMENDED when:
 * - Using native recording backend with cloud transcription services (for compression)
 */
export async function checkFfmpeg() {
	// Only check in Tauri desktop app
	if (!window.__TAURI_INTERNALS__) return;

	const { data: ffmpegInstalled } =
		await rpc.ffmpeg.checkFfmpegInstalled.ensure();

	if (ffmpegInstalled === true) return; // FFmpeg is installed, all good

	// Case 1: Whisper C++ with browser backend - always requires FFmpeg
	if (isUsingWhisperCppWithBrowserBackend()) {
		toast.warning('FFmpeg Required for Current Settings', {
			description:
				'Whisper C++ requires FFmpeg to convert audio to 16kHz WAV format when using browser recording.',
			action: {
				label: 'Install FFmpeg',
				onClick: () => goto('/install-ffmpeg'),
			},
			duration: 15000,
		});
		return;
	}

	// Case 2: Whisper C++ with native backend at wrong sample rate
	if (isUsingNativeBackendAtWrongSampleRate()) {
		toast.warning('FFmpeg Required for Current Settings', {
			description:
				'Whisper C++ requires 16kHz audio. FFmpeg is needed to convert your current sample rate.',
			action: {
				label: 'Install FFmpeg',
				onClick: () => goto('/install-ffmpeg'),
			},
			duration: 15000,
		});
		return;
	}

	// Case 3: Native backend with cloud services - recommended for compression
	if (isUsingNativeBackendWithCloudTranscription()) {
		toast.info('Install FFmpeg for Enhanced Audio Support', {
			description:
				'FFmpeg enables audio compression for faster uploads to transcription services.',
			action: {
				label: 'Install FFmpeg',
				onClick: () => goto('/install-ffmpeg'),
			},
			duration: 10000,
		});
		return;
	}
}
