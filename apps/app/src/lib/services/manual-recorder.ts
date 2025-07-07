// import { extension } from '@repo/extension';
import {
	TIMESLICE_MS,
	type CancelRecordingResult,
	type WhisperingRecordingState,
} from '$lib/constants/audio';
import { Err, Ok, type Result, tryAsync, trySync } from 'wellcrafted/result';
import type { TaggedError } from 'wellcrafted/error';
import {
	getRecordingStream,
	cleanupRecordingStream,
	enumerateRecordingDevices,
	type UpdateStatusMessageFn,
	type DeviceAcquisitionOutcome,
} from './device-stream';

type ManualRecorderServiceError = TaggedError<'ManualRecorderServiceError'>;

type ActiveRecording = {
	selectedDeviceId: string | null;
	bitrateKbps: string;
	stream: MediaStream;
	mediaRecorder: MediaRecorder;
	recordedChunks: Blob[];
};

export function createManualRecorderService() {
	let activeRecording: ActiveRecording | null = null;

	return {
		getRecorderState: (): Result<
			WhisperingRecordingState,
			ManualRecorderServiceError
		> => {
			return Ok(activeRecording ? 'RECORDING' : 'IDLE');
		},

		enumerateRecordingDevices,

		startRecording: async (
			{
				selectedDeviceId,
				bitrateKbps,
			}: {
				selectedDeviceId: string | null;
				bitrateKbps: string;
			},
			{ sendStatus }: { sendStatus: UpdateStatusMessageFn },
		): Promise<
			Result<DeviceAcquisitionOutcome, ManualRecorderServiceError>
		> => {
			// Ensure we're not already recording
			if (activeRecording) {
				return Err({
					name: 'ManualRecorderServiceError',
					message:
						'A recording is already in progress. Please stop the current recording before starting a new one.',
					context: { activeRecording },
					cause: undefined,
				});
			}

			sendStatus({
				title: '🎙️ Starting Recording',
				description: 'Setting up your microphone...',
			});

			// Get the recording stream
			const { data: streamResult, error: acquireStreamError } =
				await getRecordingStream(selectedDeviceId, sendStatus);
			if (acquireStreamError) {
				return Err({
					name: 'ManualRecorderServiceError',
					message: acquireStreamError.message,
					context: acquireStreamError.context,
					cause: acquireStreamError,
				});
			}

			const { stream, deviceOutcome } = streamResult;

			const { data: mediaRecorder, error: recorderError } = trySync({
				try: () =>
					new MediaRecorder(stream, {
						bitsPerSecond: Number(bitrateKbps) * 1000,
					}),
				mapError: (error): ManualRecorderServiceError => ({
					name: 'ManualRecorderServiceError',
					message:
						'Failed to initialize the audio recorder. This could be due to unsupported audio settings, microphone conflicts, or browser limitations. Please check your microphone is working and try adjusting your audio settings.',
					context: { selectedDeviceId, bitrateKbps },
					cause: error,
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
				selectedDeviceId,
				bitrateKbps,
				stream,
				mediaRecorder,
				recordedChunks,
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
		}: { sendStatus: UpdateStatusMessageFn }): Promise<
			Result<Blob, ManualRecorderServiceError>
		> => {
			if (!activeRecording) {
				return Err({
					name: 'ManualRecorderServiceError',
					message:
						'Cannot stop recording because no active recording session was found. Make sure you have started recording before attempting to stop it.',
					context: { activeRecording },
					cause: undefined,
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
				mapError: (error): ManualRecorderServiceError => ({
					name: 'ManualRecorderServiceError',
					message:
						'Failed to properly stop and save the recording. This might be due to corrupted audio data, insufficient storage space, or a browser issue. Your recording data may be lost.',
					context: {
						chunksCount: recording.recordedChunks.length,
						mimeType: recording.mediaRecorder.mimeType,
						state: recording.mediaRecorder.state,
					},
					cause: error,
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

		cancelRecording: async ({
			sendStatus,
		}: { sendStatus: UpdateStatusMessageFn }): Promise<
			Result<CancelRecordingResult, ManualRecorderServiceError>
		> => {
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
	};
}

export const NavigatorRecorderServiceLive = createManualRecorderService();
