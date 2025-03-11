import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingRecordingState } from '@repo/shared';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type { RecorderService } from './RecorderService';

export function createRecorderServiceTauri(): RecorderService {
	return {
		getRecorderState: async () => {
			const result =
				await invoke<WhisperingRecordingState>('get_recorder_state');
			if (!result.ok)
				return WhisperingErr({
					title: '🎤 Unable to Get Recorder State',
					description:
						'We encountered an issue while getting the recorder state. This could be because your microphone is being used by another app, your microphone permissions are denied, or the selected recording device is disconnected',
					action: { type: 'more-details', error: result.error },
				});
			return Ok(result.data);
		},
		enumerateRecordingDevices: async () => {
			const invokeResult = await invoke<{ deviceId: string; label: string }[]>(
				'enumerate_recording_devices',
			);
			if (!invokeResult.ok) {
				return WhisperingErr({
					title: '🎤 Device Access Error',
					description:
						'Oops! We need permission to see your microphones. Check your browser settings and try again!',
					action: { type: 'more-details', error: invokeResult.error },
				});
			}
			const deviceInfos = invokeResult.data;
			return Ok(deviceInfos);
		},
		ensureRecordingSession: async (
			settings,
			{ sendStatus: sendUpdateStatus },
		) => {
			sendUpdateStatus({
				title: '🎤 Setting Up',
				description:
					'Initializing your recording session and checking microphone access...',
			});
			const result = await invoke('init_recording_session', {
				deviceName: settings['recording.tauri.selectedAudioInputName'],
			});
			if (!result.ok)
				return WhisperingErr({
					title: '🎤 Unable to Start Recording Session',
					description:
						'We encountered an issue while setting up your recording session. This could be because your microphone is being used by another app, your microphone permissions are denied, or the selected recording device is disconnected',
					action: { type: 'more-details', error: result.error },
				});
			return Ok(undefined);
		},
		closeRecordingSession: async ({ sendStatus: sendUpdateStatus }) => {
			sendUpdateStatus({
				title: '🔄 Closing Session',
				description:
					'Safely closing your recording session and freeing up resources...',
			});
			const result = await invoke<void>('close_recording_session');
			if (!result.ok)
				return WhisperingErr({
					title: '⚠️ Session Close Failed',
					description:
						'Unable to properly close the recording session. Please try again.',
					action: { type: 'more-details', error: result.error },
				});
			return Ok(undefined);
		},
		startRecording: async (recordingId) => {
			const result = await invoke<void>('start_recording', {
				recordingId,
			});
			if (!result.ok)
				return WhisperingErr({
					title: '🎤 Recording Start Failed',
					description:
						'Unable to start recording. Please check your microphone and try again.',
					action: { type: 'more-details', error: result.error },
				});
			return Ok(undefined);
		},
		stopRecording: async () => {
			const result = await invoke<number[]>('stop_recording');
			if (!result.ok)
				return WhisperingErr({
					title: '⏹️ Recording Stop Failed',
					description: 'Unable to save your recording. Please try again.',
					action: { type: 'more-details', error: result.error },
				});

			const float32Array = new Float32Array(result.data);
			const blob = createWavFromFloat32(float32Array);
			return Ok(blob);
		},
		cancelRecording: async ({ sendStatus: sendUpdateStatus }) => {
			sendUpdateStatus({
				title: '🛑 Cancelling',
				description:
					'Safely stopping your recording and cleaning up resources...',
			});
			const result = await invoke('cancel_recording');
			if (!result.ok)
				return WhisperingErr({
					title: '⚠️ Cancel Failed',
					description:
						'Unable to cancel the recording. Please try closing the app and starting again.',
					action: { type: 'more-details', error: result.error },
				});
			return Ok(undefined);
		},
	};
}

async function invoke<T>(command: string, args?: Record<string, unknown>) {
	return tryAsync({
		try: async () => await tauriInvoke<T>(command, args),
		mapErr: (error) =>
			Err({ _tag: 'TauriInvokeError', command, error } as const),
	});
}

function createWavFromFloat32(float32Array: Float32Array, sampleRate = 96000) {
	// WAV header parameters
	const numChannels = 1; // Mono
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
