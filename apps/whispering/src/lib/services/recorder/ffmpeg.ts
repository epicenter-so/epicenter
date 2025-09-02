import type { CancelRecordingResult } from '$lib/constants/audio';
import {
	IS_WINDOWS,
	IS_MACOS,
	IS_LINUX,
	PLATFORM_TYPE,
} from '$lib/constants/platform';
import { Ok, Err, type Result, tryAsync } from 'wellcrafted/result';
import type { Device, DeviceAcquisitionOutcome } from '../types';
import { asDeviceIdentifier } from '../types';
import type {
	RecorderService,
	RecorderServiceError,
	StartRecordingParams,
} from './types';
import { RecorderServiceErr } from './types';
import type { Child } from '@tauri-apps/plugin-shell';
import { extractErrorMessage } from 'wellcrafted/error';
import { remove, exists } from '@tauri-apps/plugin-fs';
import { join, appDataDir } from '@tauri-apps/api/path';
import { settings } from '$lib/stores/settings.svelte';
import * as services from '$lib/services';
import { interpolateTemplate, asTemplateString } from '$lib/utils/template';
import { asShellCommand } from '$lib/services/command';

/**
 * Get the platform-specific FFmpeg audio input format
 */
function getAudioInputFormat() {
	if (IS_MACOS) return 'avfoundation';
	if (IS_WINDOWS) return 'dshow';
	if (IS_LINUX) return 'alsa';
	return 'pulse';
}

/**
 * Parse FFmpeg device enumeration output based on platform
 */
function parseDevices(output: string): Device[] {
	// Platform-specific parsing configuration
	const platformConfig = {
		macos: {
			// macOS format: [AVFoundation input device @ 0x...] [0] Built-in Microphone
			regex: /\[AVFoundation.*?\]\s+\[(\d+)\]\s+(.+)/,
			extractDevice: (match) => ({
				id: asDeviceIdentifier(match[2].trim()),
				label: match[2].trim(),
			}),
		},
		windows: {
			// Windows DirectShow format: "Microphone Name" (audio)
			regex: /^\s*"(.+?)"\s+\(audio\)/,
			extractDevice: (match) => ({
				id: asDeviceIdentifier(match[1]),
				label: match[1],
			}),
		},
		linux: {
			// Linux ALSA format: hw:0,0 Device Name
			regex: /^(hw:\d+,\d+)\s+(.+)/,
			extractDevice: (match) => ({
				id: asDeviceIdentifier(match[1]),
				label: match[2].trim(),
			}),
		},
	} satisfies Record<
		string,
		{ regex: RegExp; extractDevice: (match: RegExpMatchArray) => Device }
	>;

	// Select configuration based on platform
	const config = platformConfig[PLATFORM_TYPE];

	// Parse lines using reduce for functional approach
	return output.split('\n').reduce<Device[]>((devices, line) => {
		const match = line.match(config.regex);
		if (match) devices.push(config.extractDevice(match));
		return devices;
	}, []);
}

export function createFfmpegRecorderService(): RecorderService {
	let currentProcess: Child | null = null;
	let currentRecordingId: string | null = null;

	// Lazily get output directory from settings or default
	const getOutputDir = async () =>
		settings.value['recording.desktop.outputFolder'] ?? (await appDataDir());

	// Lazily get output path from recording ID
	const getOutputPath = async (): Promise<string> =>
		join(await getOutputDir(), `${currentRecordingId}.wav`);

	const enumerateDevices = async (): Promise<
		Result<Device[], RecorderServiceError>
	> => {
		const format = getAudioInputFormat();

		// Build platform-specific commands
		const command = asShellCommand(
			{
				macos: 'ffmpeg -f avfoundation -list_devices true -i ""',
				windows: 'ffmpeg -list_devices true -f dshow -i dummy',
				linux: 'arecord -l',
			}[PLATFORM_TYPE],
		);

		const { data: result, error: executeError } =
			await services.command.execute(command);
		if (executeError) {
			return RecorderServiceErr({
				message: 'Failed to enumerate recording devices',
				cause: executeError,
			});
		}

		// FFmpeg lists devices to stderr, not stdout
		const output = result.stderr;

		const devices = parseDevices(output);

		if (devices.length === 0) {
			return RecorderServiceErr({
				message: 'No recording devices found',
				context: { output },
				cause: undefined,
			});
		}

		return Ok(devices);
	};

	return {
		getCurrentRecordingId: async (): Promise<
			Result<string | null, RecorderServiceError>
		> => {
			return Ok(currentRecordingId);
		},

		enumerateDevices,

		startRecording: async (
			params: StartRecordingParams,
			{ sendStatus },
		): Promise<Result<DeviceAcquisitionOutcome, RecorderServiceError>> => {
			// FFmpeg implementation only handles FFmpeg params
			if (params.implementation !== 'ffmpeg') {
				return RecorderServiceErr({
					message: 'FFmpeg recorder received non-FFmpeg parameters',
					context: { params },
					cause: undefined,
				});
			}

			const { selectedDeviceId, recordingId, commandTemplate } = params;

			// Stop any existing recording
			if (currentProcess) {
				try {
					await currentProcess.kill();
				} catch (e) {
					console.error('Failed to kill existing FFmpeg process:', e);
				}
				currentProcess = null;
			}

			// Enumerate devices to validate selection
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
						message: selectedDeviceId
							? "We couldn't find the selected microphone. Make sure it's connected and try again!"
							: "We couldn't find any microphones. Make sure they're connected and try again!",
						context: { selectedDeviceId, deviceIds },
						cause: undefined,
					});
				}

				if (!selectedDeviceId) {
					sendStatus({
						title: '🔍 No Device Selected',
						description:
							"No worries! We'll find the best microphone for you automatically...",
					});
					return Ok({
						outcome: 'fallback',
						reason: 'no-device-selected',
						fallbackDeviceId,
					});
				}

				const deviceExists = deviceIds.includes(selectedDeviceId);

				if (deviceExists) return Ok({ outcome: 'success' });

				sendStatus({
					title: '⚠️ Finding a New Microphone',
					description:
						"That microphone isn't available. Let's try finding another one...",
				});

				return Ok({
					outcome: 'fallback',
					reason: 'preferred-device-unavailable',
					fallbackDeviceId,
				});
			};

			const { data: deviceOutcome, error: acquireDeviceError } =
				acquireDevice();
			if (acquireDeviceError) return Err(acquireDeviceError);

			// Determine which device to use
			const deviceIdentifier =
				deviceOutcome.outcome === 'success'
					? selectedDeviceId
					: deviceOutcome.fallbackDeviceId;

			if (!deviceIdentifier) {
				return RecorderServiceErr({
					message: 'No device identifier available',
					context: { deviceOutcome },
					cause: undefined,
				});
			}

			// Default template with actual device name injected
			// Only {{outputFolder}} and {{recordingId}} are runtime variables
			const format = getAudioInputFormat();
			const deviceInput = {
				macos: `":${deviceIdentifier}"`, // macOS needs colon prefix
				windows: `"audio=${deviceIdentifier}"`, // Windows needs audio= prefix
				linux: `"${deviceIdentifier}"`, // Linux uses the device ID directly
			}[PLATFORM_TYPE];

			const defaultTemplate = asTemplateString(
				`ffmpeg -f ${format} -i ${deviceInput} -acodec pcm_s16le -ar 16000 "{{outputFolder}}/{{recordingId}}.wav"`,
			);

			const command = interpolateTemplate(commandTemplate ?? defaultTemplate, {
				outputFolder: await getOutputDir(),
				// Only runtime variables need interpolation
				// Device, format, codec etc. are already in the template
				recordingId,
			});

			sendStatus({
				title: '🎤 Setting Up',
				description: 'Initializing FFmpeg recording session...',
			});

			// Use command service to spawn FFmpeg process
			const { data: process, error: startError } = await services.command.spawn(
				asShellCommand(command),
			);

			if (startError) return Err(startError);

			currentProcess = process;
			currentRecordingId = recordingId;

			sendStatus({
				title: '🎙️ Recording',
				description: 'FFmpeg is now recording audio...',
			});

			return Ok(deviceOutcome);
		},

		stopRecording: async ({
			sendStatus,
		}): Promise<Result<Blob, RecorderServiceError>> => {
			if (!currentProcess || !currentRecordingId) {
				return RecorderServiceErr({
					message: 'No active recording to stop',
					cause: undefined,
				});
			}

			const outputPath = await getOutputPath();

			sendStatus({
				title: '⏹️ Stopping',
				description: 'Stopping FFmpeg recording...',
			});

			// Send quit signal to FFmpeg (graceful shutdown)
			const { error: killError } = await tryAsync({
				try: async () => {
					// Write 'q' to stdin to quit FFmpeg gracefully
					await currentProcess.write(new TextEncoder().encode('q'));
					// Wait a bit for graceful shutdown
					await new Promise((resolve) => setTimeout(resolve, 500));
					// Force kill if still running
					await currentProcess.kill();
				},
				mapErr: (error) =>
					RecorderServiceErr({
						message: 'Failed to stop FFmpeg process',
						cause: error,
					}),
			});

			if (killError) {
				sendStatus({
					title: '❌ Error Stopping Recording',
					description:
						"We couldn't stop the recording properly. Attempting to recover your audio...",
				});
			}

			currentProcess = null;
			currentRecordingId = null;

			// Wait a moment for file to be written
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Check if file exists
			const { data: fileExists, error: existsError } = await tryAsync({
				try: () => exists(outputPath),
				mapErr: (error) =>
					RecorderServiceErr({
						message: 'Failed to check if recording file exists',
						context: { path: outputPath },
						cause: error,
					}),
			});

			if (existsError) return Err(existsError);

			if (!fileExists) {
				return RecorderServiceErr({
					message: 'Recording file was not created',
					context: { path: outputPath },
					cause: undefined,
				});
			}

			// Read the recorded file
			sendStatus({
				title: '📁 Reading Recording',
				description: 'Loading your recording from disk...',
			});

			const { data: blob, error: readError } =
				await services.fs.pathToBlob(outputPath);

			if (readError) {
				return RecorderServiceErr({
					message: 'Unable to read recording file',
					cause: readError,
				});
			}

			return Ok(blob);
		},

		cancelRecording: async ({
			sendStatus,
		}): Promise<Result<CancelRecordingResult, RecorderServiceError>> => {
			if (!currentRecordingId) {
				return Ok({ status: 'no-recording' });
			}

			sendStatus({
				title: '🛑 Cancelling',
				description: 'Stopping FFmpeg recording and cleaning up...',
			});

			// Get the output path using helper function for cleanup
			const outputPath = await getOutputPath();

			// Kill the FFmpeg process
			if (currentProcess) {
				try {
					await currentProcess.kill();
				} catch (e) {
					console.error('Failed to kill FFmpeg process:', e);
				}
				currentProcess = null;
			}

			currentRecordingId = null;

			// Delete the output file if it exists
			if (outputPath) {
				const { error: removeError } = await tryAsync({
					try: async () => {
						const fileExists = await exists(outputPath);
						if (fileExists) await remove(outputPath);
					},
					mapErr: (error) =>
						RecorderServiceErr({
							message: 'Failed to delete recording file',
							context: { path: outputPath },
							cause: error,
						}),
				});

				if (removeError) {
					sendStatus({
						title: '❌ Error Deleting Recording File',
						description:
							"We couldn't delete the recording file. Continuing with the cancellation process...",
					});
				}
			}

			return Ok({ status: 'cancelled' });
		},
	};
}
