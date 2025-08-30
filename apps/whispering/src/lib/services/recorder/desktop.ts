import type { CancelRecordingResult } from '$lib/constants/audio';

import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { readFile } from '@tauri-apps/plugin-fs';
import { remove } from '@tauri-apps/plugin-fs';
import { Err, Ok, type Result, tryAsync } from 'wellcrafted/result';

import type { Device, DeviceAcquisitionOutcome } from '../types';
import type {
	RecorderService,
	RecorderServiceError,
	StartRecordingParams,
} from './types';

import { asDeviceIdentifier } from '../types';
import { RecorderServiceErr } from './types';

/**
 * Audio recording data returned from the Rust backend
 */
type AudioRecording = {
	channels: number;
	durationSeconds: number;
	filePath?: string;
	sampleRate: number;
};

export function createDesktopRecorderService(): RecorderService {
	const enumerateDevices = async (): Promise<
		Result<Device[], RecorderServiceError>
	> => {
		const { data: deviceNames, error: enumerateRecordingDevicesError } =
			await invoke<string[]>('enumerate_recording_devices');
		if (enumerateRecordingDevicesError) {
			return RecorderServiceErr({
				cause: enumerateRecordingDevicesError,
				message: 'Failed to enumerate recording devices',
			});
		}
		// On desktop, device names serve as both ID and label
		return Ok(
			deviceNames.map((name) => ({
				id: asDeviceIdentifier(name),
				label: name,
			})),
		);
	};

	return {
		cancelRecording: async ({
			sendStatus,
		}): Promise<Result<CancelRecordingResult, RecorderServiceError>> => {
			// Check current state first
			const { data: recordingId, error: getRecordingIdError } = await invoke<
				null | string
			>('get_current_recording_id');
			if (getRecordingIdError) {
				return RecorderServiceErr({
					cause: getRecordingIdError,
					context: { operation: 'cancelRecording' },
					message:
						'Unable to check recording state. Please try closing the app and starting again.',
				});
			}

			if (!recordingId) {
				return Ok({ status: 'no-recording' });
			}

			sendStatus({
				title: '🛑 Cancelling',
				description:
					'Safely stopping your recording and cleaning up resources...',
			});

			// First get the recording data to know if there's a file to delete
			const { data: audioRecording } =
				await invoke<AudioRecording>('stop_recording');

			// If there's a file path, delete the file using Tauri FS plugin
			if (audioRecording?.filePath) {
				const { filePath } = audioRecording;
				const { error: removeError } = await tryAsync({
					mapErr: (error) =>
						RecorderServiceErr({
							cause: error,
							context: { audioRecording },
							message: 'Failed to delete recording file.',
						}),
					try: () => remove(filePath),
				});
				if (removeError)
					sendStatus({
						title: '❌ Error Deleting Recording File',
						description:
							"We couldn't delete the recording file. Continuing with the cancellation process...",
					});
			}

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

		enumerateDevices,

		getCurrentRecordingId: async (): Promise<
			Result<null | string, RecorderServiceError>
		> => {
			const { data: recordingId, error: getCurrentRecordingIdError } =
				await invoke<null | string>('get_current_recording_id');
			if (getCurrentRecordingIdError)
				return RecorderServiceErr({
					cause: getCurrentRecordingIdError,
					context: { error: getCurrentRecordingIdError },
					message:
						'We encountered an issue while getting the current recording. This could be because your microphone is being used by another app, your microphone permissions are denied, or the selected recording device is disconnected',
				});

			return Ok(recordingId);
		},

		startRecording: async (
			params: StartRecordingParams,
			{ sendStatus },
		): Promise<Result<DeviceAcquisitionOutcome, RecorderServiceError>> => {
			// Desktop implementation only handles desktop params
			if (params.platform !== 'desktop') {
				return RecorderServiceErr({
					cause: undefined,
					context: { params },
					message: 'Desktop recorder received non-desktop parameters',
				});
			}

			const { outputFolder, recordingId, sampleRate, selectedDeviceId } =
				params;
			const { data: devices, error: enumerateError } = await enumerateDevices();
			if (enumerateError) return Err(enumerateError);

			const acquireDevice = (): Result<
				DeviceAcquisitionOutcome,
				RecorderServiceError
			> => {
				const deviceIds = devices.map((d) => d.id);
				const fallbackDeviceId = deviceIds.at(0);
				if (!fallbackDeviceId) {
					return RecorderServiceErr({
						cause: undefined,
						context: { deviceIds, selectedDeviceId },
						message: selectedDeviceId
							? "We couldn't find the selected microphone. Make sure it's connected and try again!"
							: "We couldn't find any microphones. Make sure they're connected and try again!",
					});
				}

				if (!selectedDeviceId) {
					sendStatus({
						title: '🔍 No Device Selected',
						description:
							"No worries! We'll find the best microphone for you automatically...",
					});
					return Ok({
						fallbackDeviceId,
						outcome: 'fallback',
						reason: 'no-device-selected',
					});
				}

				// Check if the selected device exists in the devices array
				const deviceExists = deviceIds.includes(selectedDeviceId);

				if (deviceExists) return Ok({ outcome: 'success' });

				sendStatus({
					title: '⚠️ Finding a New Microphone',
					description:
						"That microphone isn't available. Let's try finding another one...",
				});

				return Ok({
					fallbackDeviceId,
					outcome: 'fallback',
					reason: 'preferred-device-unavailable',
				});
			};

			const { data: deviceOutcome, error: acquireDeviceError } =
				acquireDevice();
			if (acquireDeviceError) return Err(acquireDeviceError);

			// Determine which device name to use based on the outcome
			const deviceIdentifier =
				deviceOutcome.outcome === 'success'
					? selectedDeviceId
					: deviceOutcome.fallbackDeviceId;

			// Now initialize recording with the chosen device
			sendStatus({
				title: '🎤 Setting Up',
				description:
					'Initializing your recording session and checking microphone access...',
			});

			// Convert sample rate string to number if provided
			const sampleRateNum = sampleRate
				? Number.parseInt(sampleRate, 10)
				: undefined;

			const { error: initRecordingSessionError } = await invoke(
				'init_recording_session',
				{
					deviceIdentifier,
					outputFolder: outputFolder || undefined,
					recordingId,
					sampleRate: sampleRateNum,
				},
			);
			if (initRecordingSessionError)
				return RecorderServiceErr({
					cause: initRecordingSessionError,
					context: {
						deviceIdentifier,
						selectedDeviceId,
					},
					message:
						'We encountered an issue while setting up your recording session. This could be because your microphone is being used by another app, your microphone permissions are denied, or the selected recording device is disconnected',
				});

			sendStatus({
				title: '🎙️ Starting Recording',
				description:
					'Recording session initialized, now starting to capture audio...',
			});
			const { error: startRecordingError } =
				await invoke<void>('start_recording');
			if (startRecordingError)
				return RecorderServiceErr({
					cause: startRecordingError,
					context: { deviceIdentifier, deviceOutcome },
					message:
						'Unable to start recording. Please check your microphone and try again.',
				});

			return Ok(deviceOutcome);
		},

		stopRecording: async ({
			sendStatus,
		}): Promise<Result<Blob, RecorderServiceError>> => {
			const { data: audioRecording, error: stopRecordingError } =
				await invoke<AudioRecording>('stop_recording');
			if (stopRecordingError) {
				return RecorderServiceErr({
					cause: stopRecordingError,
					context: { operation: 'stopRecording' },
					message: 'Unable to save your recording. Please try again.',
				});
			}

			const { filePath } = audioRecording;
			// Desktop recorder should always write to a file
			if (!filePath) {
				return RecorderServiceErr({
					cause: undefined,
					context: {
						audioRecording,
						operation: 'stopRecording',
					},
					message: 'Recording file path not provided by backend.',
				});
			}
			// audioRecording is now AudioRecordingWithFile

			// Read the WAV file from disk
			sendStatus({
				title: '📁 Reading Recording',
				description: 'Loading your recording from disk...',
			});

			const { data: blob, error: readRecordingFileError } = await tryAsync({
				mapErr: (error) =>
					RecorderServiceErr({
						cause: error,
						context: { audioRecording },
						message: 'Unable to read recording file. Please try again.',
					}),
				try: async () => {
					const fileBytes = await readFile(filePath);
					return new Blob([fileBytes], { type: 'audio/wav' });
				},
			});
			if (readRecordingFileError) return Err(readRecordingFileError);

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
	};
}

async function invoke<T>(command: string, args?: Record<string, unknown>) {
	return tryAsync({
		mapErr: (error) =>
			Err({ command, error, name: 'TauriInvokeError' } as const),
		try: async () => await tauriInvoke<T>(command, args),
	});
}
