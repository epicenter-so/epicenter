import { Err, Ok, tryAsync } from '@epicenterhq/result';
import type { Result, TaggedError } from '@epicenterhq/result';
import type {
	WhisperingRecordingState,
	CancelRecordingResult,
} from '$lib/constants';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';

type RecordingServiceError = TaggedError<'RecordingServiceError'>;

type UpdateStatusMessageFn = (args: {
	title: string;
	description: string;
}) => void;

export function createCpalRecorderService() {
	return {
		getRecorderState: async (): Promise<
			Result<WhisperingRecordingState, RecordingServiceError>
		> => {
			const { data: recorderState, error: getRecorderStateError } =
				await invoke<WhisperingRecordingState>('get_recorder_state');
			if (getRecorderStateError)
				return Err({
					name: 'RecordingServiceError',
					message:
						'We encountered an issue while getting the recorder state. This could be because your microphone is being used by another app, your microphone permissions are denied, or the selected recording device is disconnected',
					action: { type: 'more-details', error: getRecorderStateError },
					context: {},
					cause: getRecorderStateError,
				});
			return Ok(recorderState);
		},

		enumerateRecordingDevices: async (): Promise<
			Result<{ deviceId: string; label: string }[], RecordingServiceError>
		> => {
			const { data: deviceInfos, error: enumerateRecordingDevicesError } =
				await invoke<{ deviceId: string; label: string }[]>(
					'enumerate_recording_devices',
				);
			if (enumerateRecordingDevicesError) {
				return Err({
					name: 'RecordingServiceError',
					message:
						'We need permission to see your microphones. Check your browser settings and try again!',
					context: {},
					cause: enumerateRecordingDevicesError,
				});
			}
			return Ok(deviceInfos);
		},

		startRecording: async (
			{ selectedDeviceId }: { selectedDeviceId: string | null },
			{ sendStatus }: { sendStatus: UpdateStatusMessageFn },
		): Promise<Result<void, RecordingServiceError>> => {
			sendStatus({
				title: '🎤 Setting Up',
				description:
					'Initializing your recording session and checking microphone access...',
			});
			const { error: initRecordingSessionError } = await invoke(
				'init_recording_session',
				{ deviceName: selectedDeviceId },
			);
			if (initRecordingSessionError)
				return Err({
					name: 'RecordingServiceError',
					message:
						'We encountered an issue while setting up your recording session. This could be because your microphone is being used by another app, your microphone permissions are denied, or the selected recording device is disconnected',
					context: {
						selectedDeviceId,
					},
					cause: initRecordingSessionError,
				});

			sendStatus({
				title: '🎙️ Starting Recording',
				description:
					'Recording session initialized, now starting to capture audio...',
			});
			const { error: startRecordingError } =
				await invoke<void>('start_recording');
			if (startRecordingError)
				return Err({
					name: 'RecordingServiceError',
					message:
						'Unable to start recording. Please check your microphone and try again.',
					context: {},
					cause: startRecordingError,
				});
			return Ok(undefined);
		},

		stopRecording: async ({
			sendStatus,
		}: { sendStatus: UpdateStatusMessageFn }): Promise<
			Result<Blob, RecordingServiceError>
		> => {
			const { data: audioRecording, error: stopRecordingError } = await invoke<{
				audioData: number[];
				sampleRate: number;
				channels: number;
				durationSeconds: number;
			}>('stop_recording');
			if (stopRecordingError) {
				return Err({
					name: 'RecordingServiceError',
					message: 'Unable to save your recording. Please try again.',
					context: {},
					cause: stopRecordingError,
				});
			}

			const float32Array = new Float32Array(audioRecording.audioData);
			const blob = createWavFromFloat32(
				float32Array,
				audioRecording.sampleRate,
				audioRecording.channels,
			);

			// Close the recording session after stopping
			sendStatus({
				title: '🔄 Closing Session',
				description: 'Cleaning up recording resources...',
			});
			const { error: closeError } = await invoke<void>(
				'close_recording_session',
			);
			if (closeError) {
				// Log but don't fail the stop operation
				console.error('Failed to close recording session:', closeError);
			}

			return Ok(blob);
		},

		cancelRecording: async ({
			sendStatus,
		}: { sendStatus: UpdateStatusMessageFn }): Promise<
			Result<CancelRecordingResult, RecordingServiceError>
		> => {
			// Check current state first
			const { data: recorderState, error: getStateError } =
				await invoke<WhisperingRecordingState>('get_recorder_state');
			if (getStateError) {
				return Err({
					name: 'RecordingServiceError',
					message:
						'Unable to check recording state. Please try closing the app and starting again.',
					context: {},
					cause: getStateError,
				});
			}

			if (recorderState === 'IDLE') {
				return Ok({ status: 'no-recording' });
			}

			sendStatus({
				title: '🛑 Cancelling',
				description:
					'Safely stopping your recording and cleaning up resources...',
			});
			const { error: cancelRecordingError } = await invoke('cancel_recording');
			if (cancelRecordingError)
				return Err({
					name: 'RecordingServiceError',
					message:
						'Unable to cancel the recording. Please try closing the app and starting again.',
					context: {},
					cause: cancelRecordingError,
				});

			// Close the recording session after cancelling
			sendStatus({
				title: '🔄 Closing Session',
				description: 'Cleaning up recording resources...',
			});
			const { error: closeError } = await invoke<void>(
				'close_recording_session',
			);
			if (closeError) {
				// Log but don't fail the cancel operation
				console.error('Failed to close recording session:', closeError);
			}

			return Ok({ status: 'cancelled' });
		},
	};
}

async function invoke<T>(command: string, args?: Record<string, unknown>) {
	return tryAsync({
		try: async () => await tauriInvoke<T>(command, args),
		mapError: (error) =>
			Err({ name: 'TauriInvokeError', command, error } as const),
	});
}

function createWavFromFloat32(
	float32Array: Float32Array,
	sampleRate: number,
	numChannels: number,
) {
	// WAV header parameters
	const bitsPerSample = 32;
	const bytesPerSample = bitsPerSample / 8;

	// Calculate sizes
	const dataSize = float32Array.length * bytesPerSample;
	const headerSize = 44; // Standard WAV header size
	const totalSize = headerSize + dataSize;

	// Create the buffer
	const buffer = new ArrayBuffer(totalSize);
	const view = new DataView(buffer);

	// Write WAV header
	// "RIFF" chunk descriptor
	writeString(view, 0, 'RIFF');
	view.setUint32(4, totalSize - 8, true);
	writeString(view, 8, 'WAVE');

	// "fmt " sub-chunk
	writeString(view, 12, 'fmt ');
	view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
	view.setUint16(20, 3, true); // AudioFormat (3 for Float)
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
	view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
	view.setUint16(34, bitsPerSample, true);

	// "data" sub-chunk
	writeString(view, 36, 'data');
	view.setUint32(40, dataSize, true);

	// Write audio data
	const dataView = new Float32Array(buffer, headerSize);
	dataView.set(float32Array);

	// Create and return blob
	return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
	for (let i = 0; i < string.length; i++) {
		view.setUint8(offset + i, string.charCodeAt(i));
	}
}

export const CpalRecorderServiceLive = createCpalRecorderService();
