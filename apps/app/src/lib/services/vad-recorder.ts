import { Err, Ok, tryAsync, trySync } from 'wellcrafted/result';
import type { VadState } from '$lib/constants/audio';
import { WhisperingError } from '$lib/result';
import { MicVAD, utils } from '@ricky0123/vad-web';
import {
	getRecordingStream,
	cleanupRecordingStream,
	type DeviceAcquisitionOutcome,
} from './device-stream';

export function createVadService() {
	let maybeVad: MicVAD | null = null;
	let vadState: VadState = 'IDLE';
	let currentStream: MediaStream | null = null;

	return {
		getVadState: (): VadState => {
			return vadState;
		},

		startActiveListening: async ({
			onSpeechStart,
			onSpeechEnd,
			deviceId,
		}: {
			onSpeechStart: () => void;
			onSpeechEnd: (blob: Blob) => void;
			deviceId: string | null;
		}) => {
			// Always start fresh - no reuse
			if (maybeVad) {
				return Err(
					WhisperingError({
						title: 'VAD already active',
						description: 'Stop the current session before starting a new one.',
					})
				);
			}

			// Get validated stream with device fallback
			const { data: streamResult, error: streamError } = await getRecordingStream(
				deviceId,
				() => {} // No-op for status updates
			);
			if (streamError) {
				return Err(
					WhisperingError({
						title: '❌ Failed to access microphone',
						description: streamError.message,
					})
				);
			}

			const { stream, deviceOutcome } = streamResult;
			currentStream = stream;

			// Create VAD with the validated stream
			const { data: newVad, error: initializeVadError } = await tryAsync({
				try: () =>
					MicVAD.new({
						stream, // Pass our validated stream directly
						submitUserSpeechOnPause: true,
						onSpeechStart: () => {
							vadState = 'SPEECH_DETECTED';
							onSpeechStart();
						},
						onSpeechEnd: (audio) => {
							vadState = 'LISTENING';
							const wavBuffer = utils.encodeWAV(audio);
							const blob = new Blob([wavBuffer], { type: 'audio/wav' });
							onSpeechEnd(blob);
						},
						onVADMisfire: () => {
							console.log('VAD misfire');
						},
						model: 'v5',
					}),
				mapError: (error) => ({
					name: 'WhisperingError',
					title: '❌ Failed to start voice activated capture',
					description: 'Your voice activated capture could not be started.',
				}),
			});
			
			if (initializeVadError) {
				// Clean up stream if VAD initialization fails
				cleanupRecordingStream(stream);
				currentStream = null;
				return Err(initializeVadError);
			}
			
			maybeVad = newVad;

			// Start listening
			const { error: startError } = trySync({
				try: () => newVad.start(),
				mapError: (error) =>
					WhisperingError({
						title: 'Failed to start Voice Activity Detector',
						description:
							error instanceof Error
								? error.message
								: 'An unknown error occurred while starting the VAD.',
					}),
			});
			if (startError) {
				// Clean up everything on start error
				trySync({
					try: () => newVad.destroy(),
					mapError: () => null,
				});
				cleanupRecordingStream(stream);
				maybeVad = null;
				currentStream = null;
				return Err(startError);
			}
			
			vadState = 'LISTENING';
			return Ok(deviceOutcome);
		},

		stopActiveListening: async () => {
			if (!maybeVad) return Ok(undefined);

			const vad = maybeVad;
			const { error: destroyError } = trySync({
				try: () => vad.destroy(),
				mapError: (error) =>
					WhisperingError({
						title: 'Failed to stop Voice Activity Detector',
						description:
							error instanceof Error ? error.message : 'Failed to stop VAD',
					}),
			});
			
			// Always clean up, even if destroy had an error
			maybeVad = null;
			vadState = 'IDLE';
			
			// Clean up our managed stream
			if (currentStream) {
				cleanupRecordingStream(currentStream);
				currentStream = null;
			}
			
			if (destroyError) return Err(destroyError);
			return Ok(undefined);
		},
	};
}

export type VadService = ReturnType<typeof createVadService>;

export const VadServiceLive = createVadService();