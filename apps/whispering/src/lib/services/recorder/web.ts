import type { CancelRecordingResult } from '$lib/constants/audio';

import { TIMESLICE_MS } from '$lib/constants/audio';
import { Err, Ok, type Result, tryAsync, trySync } from 'wellcrafted/result';

import type {
	DeviceAcquisitionOutcome,
	DeviceIdentifier,
	UpdateStatusMessageFn,
} from '../types';
import type {
	RecorderService,
	RecorderServiceError,
	StartRecordingParams,
} from './types';

import {
	cleanupRecordingStream,
	enumerateDevices,
	getRecordingStream,
} from '../device-stream';
import { RecorderServiceErr } from './types';

type ActiveRecording = {
	bitrateKbps: string;
	mediaRecorder: MediaRecorder;
	recordedChunks: Blob[];
	recordingId: string;
	selectedDeviceId: DeviceIdentifier | null;
	stream: MediaStream;
};

export function createWebRecorderService(): RecorderService {
	let activeRecording: ActiveRecording | null = null;

	return {
		cancelRecording: async ({
			sendStatus,
		}): Promise<Result<CancelRecordingResult, RecorderServiceError>> => {
			if (!activeRecording) {
				return Ok({ status: 'no-recording' });
			}

			const recording = activeRecording;
			activeRecording = null; // Clear immediately

			sendStatus({
				title: '🛑 Cancelling',
				description: 'Discarding your recording...',
			});

			// Stop the recorder
			recording.mediaRecorder.stop();

			// Clean up the stream
			cleanupRecordingStream(recording.stream);

			sendStatus({
				title: '✨ Cancelled',
				description: 'Recording discarded successfully!',
			});

			return Ok({ status: 'cancelled' });
		},

		enumerateDevices: async () => {
			const { data: devices, error } = await enumerateDevices();
			if (error) {
				return RecorderServiceErr({
					cause: error,
					context: error.context,
					message: error.message,
				});
			}
			return Ok(devices);
		},

		getCurrentRecordingId: async (): Promise<
			Result<null | string, RecorderServiceError>
		> => {
			return Ok(activeRecording?.recordingId || null);
		},

		startRecording: async (
			params: StartRecordingParams,
			{ sendStatus },
		): Promise<Result<DeviceAcquisitionOutcome, RecorderServiceError>> => {
			// Web implementation only handles web params
			if (params.platform !== 'web') {
				return RecorderServiceErr({
					cause: undefined,
					context: { params },
					message: 'Web recorder received non-web parameters',
				});
			}

			const { bitrateKbps, recordingId, selectedDeviceId } = params;
			// Ensure we're not already recording
			if (activeRecording) {
				return RecorderServiceErr({
					cause: undefined,
					context: { activeRecording },
					message:
						'A recording is already in progress. Please stop the current recording before starting a new one.',
				});
			}

			sendStatus({
				title: '🎙️ Starting Recording',
				description: 'Setting up your microphone...',
			});

			// Get the recording stream
			const { data: streamResult, error: acquireStreamError } =
				await getRecordingStream({ selectedDeviceId, sendStatus });
			if (acquireStreamError) {
				return RecorderServiceErr({
					cause: acquireStreamError,
					context: acquireStreamError.context,
					message: acquireStreamError.message,
				});
			}

			const { deviceOutcome, stream } = streamResult;

			const { data: mediaRecorder, error: recorderError } = trySync({
				mapErr: (error) =>
					RecorderServiceErr({
						cause: error,
						context: { bitrateKbps, selectedDeviceId },
						message:
							'Failed to initialize the audio recorder. This could be due to unsupported audio settings, microphone conflicts, or browser limitations. Please check your microphone is working and try adjusting your audio settings.',
					}),
				try: () =>
					new MediaRecorder(stream, {
						bitsPerSecond: Number(bitrateKbps) * 1000,
					}),
			});

			if (recorderError) {
				// Clean up stream if recorder creation fails
				cleanupRecordingStream(stream);
				return Err(recorderError);
			}

			// Set up recording state and event handlers
			const recordedChunks: Blob[] = [];

			// Store active recording state
			activeRecording = {
				bitrateKbps,
				mediaRecorder,
				recordedChunks,
				recordingId,
				selectedDeviceId,
				stream,
			};

			// Set up event handlers
			mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
				if (event.data.size) recordedChunks.push(event.data);
			});

			// Start recording
			mediaRecorder.start(TIMESLICE_MS);

			// Return the device acquisition outcome
			return Ok(deviceOutcome);
		},

		stopRecording: async ({
			sendStatus,
		}): Promise<Result<Blob, RecorderServiceError>> => {
			if (!activeRecording) {
				return RecorderServiceErr({
					cause: undefined,
					context: { activeRecording },
					message:
						'Cannot stop recording because no active recording session was found. Make sure you have started recording before attempting to stop it.',
				});
			}

			const recording = activeRecording;
			activeRecording = null; // Clear immediately to prevent race conditions

			sendStatus({
				title: '⏸️ Finishing Recording',
				description: 'Saving your audio...',
			});

			// Stop the recorder and wait for the final data
			const { data: blob, error: stopError } = await tryAsync({
				mapErr: (error) =>
					RecorderServiceErr({
						cause: error,
						context: {
							chunksCount: recording.recordedChunks.length,
							mimeType: recording.mediaRecorder.mimeType,
							state: recording.mediaRecorder.state,
						},
						message:
							'Failed to properly stop and save the recording. This might be due to corrupted audio data, insufficient storage space, or a browser issue. Your recording data may be lost.',
					}),
				try: () =>
					new Promise<Blob>((resolve) => {
						recording.mediaRecorder.addEventListener('stop', () => {
							const audioBlob = new Blob(recording.recordedChunks, {
								type: recording.mediaRecorder.mimeType,
							});
							resolve(audioBlob);
						});
						recording.mediaRecorder.stop();
					}),
			});

			// Always clean up the stream
			cleanupRecordingStream(recording.stream);

			if (stopError) return Err(stopError);

			sendStatus({
				title: '✅ Recording Saved',
				description: 'Your recording is ready for transcription!',
			});
			return Ok(blob);
		},
	};
}
