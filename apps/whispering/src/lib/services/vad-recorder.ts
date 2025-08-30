import type { VadState } from '$lib/constants/audio';

import { MicVAD, utils } from '@ricky0123/vad-web';
import { createTaggedError, extractErrorMessage } from 'wellcrafted/error';
import { Err, Ok, tryAsync, trySync } from 'wellcrafted/result';

import type { DeviceIdentifier } from './types';

import { cleanupRecordingStream, getRecordingStream } from './device-stream';

const { VadRecorderServiceErr, VadRecorderServiceError } = createTaggedError(
	'VadRecorderServiceError',
);
export type VadRecorderServiceError = ReturnType<
	typeof VadRecorderServiceError
>;

export type VadService = ReturnType<typeof createVadService>;

export function createVadService() {
	let maybeVad: MicVAD | null = null;
	let vadState: VadState = 'IDLE';
	let currentStream: MediaStream | null = null;

	return {
		getVadState: (): VadState => {
			return vadState;
		},

		startActiveListening: async ({
			deviceId,
			onSpeechEnd,
			onSpeechRealStart,
			onSpeechStart,
			onVADMisfire,
		}: Pick<MicVAD['options'], 'onSpeechRealStart' | 'onVADMisfire'> & {
			deviceId: DeviceIdentifier | null;
			onSpeechEnd: (blob: Blob) => void;
			onSpeechStart: () => void;
		}) => {
			// Always start fresh - no reuse
			if (maybeVad) {
				return VadRecorderServiceErr({
					cause: undefined,
					context: { vadState },
					message:
						'VAD already active. Stop the current session before starting a new one.',
				});
			}
			console.log('Starting VAD recording');

			// Get validated stream with device fallback
			const { data: streamResult, error: streamError } =
				await getRecordingStream({
					selectedDeviceId: deviceId,
					sendStatus: (status) => {
						console.log('VAD getRecordingStream status update:', status);
					},
				});

			console.log('Stream error', streamError);
			if (streamError) {
				return VadRecorderServiceErr({
					cause: streamError,
					context: streamError.context,
					message: streamError.message,
				});
			}

			const { deviceOutcome, stream } = streamResult;
			currentStream = stream;

			// Create VAD with the validated stream
			const { data: newVad, error: initializeVadError } = await tryAsync({
				mapErr: (error) =>
					VadRecorderServiceErr({
						cause: error,
						context: { deviceId },
						message:
							'Failed to start voice activated capture. Your voice activated capture could not be started.',
					}),
				try: () =>
					MicVAD.new({
						model: 'v5',
						onSpeechEnd: (audio) => {
							vadState = 'LISTENING';
							const wavBuffer = utils.encodeWAV(audio);
							const blob = new Blob([wavBuffer], { type: 'audio/wav' });
							onSpeechEnd(blob);
						},
						onSpeechRealStart: () => {
							onSpeechRealStart();
						},
						onSpeechStart: () => {
							vadState = 'SPEECH_DETECTED';
							onSpeechStart();
						},
						onVADMisfire: () => {
							onVADMisfire();
						},
						stream, // Pass our validated stream directly
						submitUserSpeechOnPause: true,
					}),
			});

			if (initializeVadError) {
				// Clean up stream if VAD initialization fails
				cleanupRecordingStream(stream);
				currentStream = null;
				return Err(initializeVadError);
			}

			// Start listening
			const { error: startError } = trySync({
				mapErr: (error) =>
					VadRecorderServiceErr({
						cause: error,
						context: { vadState },
						message: `Failed to start Voice Activity Detector. ${extractErrorMessage(error)}`,
					}),
				try: () => newVad.start(),
			});
			if (startError) {
				// Clean up everything on start error
				trySync({
					mapErr: (error) =>
						VadRecorderServiceErr({
							cause: error,
							context: { vadState },
							message: `Failed to destroy Voice Activity Detector. ${extractErrorMessage(error)}`,
						}),
					try: () => newVad.destroy(),
				});
				cleanupRecordingStream(stream);
				maybeVad = null;
				currentStream = null;
				return Err(startError);
			}

			maybeVad = newVad;
			vadState = 'LISTENING';
			return Ok(deviceOutcome);
		},

		stopActiveListening: async () => {
			if (!maybeVad) return Ok(undefined);

			const vad = maybeVad;
			const { error: destroyError } = trySync({
				mapErr: (error) =>
					VadRecorderServiceErr({
						cause: error,
						context: { vadState },
						message: `Failed to stop Voice Activity Detector. ${extractErrorMessage(error)}`,
					}),
				try: () => vad.destroy(),
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

export const VadServiceLive = createVadService();
