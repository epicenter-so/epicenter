import { Err, Ok, type Result, tryAsync } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import type {
	RecorderService,
	RecordingServiceError,
	RecordingSessionSettings,
} from './_types';
import { toast } from '$lib/toast';

const TIMESLICE_MS = 1000;
// Whisper API recommends a mono channel at 16kHz
const WHISPER_RECOMMENDED_MEDIA_TRACK_CONSTRAINTS = {
	channelCount: { ideal: 1 },
	sampleRate: { ideal: 16_000 },
} satisfies MediaTrackConstraints;

type ActiveRecording = {
	settings: RecordingSessionSettings;
	stream: MediaStream;
	mediaRecorder: MediaRecorder;
	recordedChunks: Blob[];
	recordingId: string;
};

export function createRecorderServiceWebFactory() {
	let activeRecording: ActiveRecording | null = null;

	return ({
		setSettingsDeviceId,
	}: {
		setSettingsDeviceId: (deviceId: string) => void;
	}): RecorderService => ({
		getRecorderState: () => {
			return Ok(activeRecording ? 'RECORDING' : 'IDLE');
		},
		enumerateRecordingDevices,

		closeRecordingSession: async ({ sendStatus }) => {
			// This method is now just a no-op since we don't maintain sessions
			// It's kept for API compatibility but will be removed in future refactoring
			sendStatus({
				title: '✅ Session Management',
				description: 'Recording sessions are now managed automatically',
			});
			return Ok(undefined);
		},

		startRecording: async ({ recordingId, settings }, { sendStatus }) => {
			// Ensure we're not already recording
			if (activeRecording) {
				return Err({
					name: 'RecordingServiceError',
					message: 'A recording is already in progress. Please stop the current recording before starting a new one.',
					context: { recordingId, activeRecording },
					cause: undefined,
				});
			}

			sendStatus({
				title: '🎙️ Starting Recording',
				description: 'Setting up your microphone...',
			});

			// Get the recording stream
			const { data: stream, error: acquireStreamError } =
				await getRecordingStream(settings, setSettingsDeviceId, sendStatus);
			if (acquireStreamError) return Err(acquireStreamError);

			// Create the MediaRecorder
			const { data: mediaRecorder, error: recorderError } = await tryAsync({
				try: async () => {
					return new MediaRecorder(stream, {
						bitsPerSecond: Number(settings.bitrateKbps) * 1000,
					});
				},
				mapError: (error): RecordingServiceError => ({
					name: 'RecordingServiceError',
					message:
						'Failed to initialize the audio recorder. This could be due to unsupported audio settings, microphone conflicts, or browser limitations. Please check your microphone is working and try adjusting your audio settings.',
					context: { recordingId, settings },
					cause: error,
				}),
			});
			if (recorderError) {
				// Clean up stream if recorder creation fails
				for (const track of stream.getTracks()) {
					track.stop();
				}
				return Err(recorderError);
			}

			// Set up the active recording
			const recordedChunks: Blob[] = [];
			activeRecording = {
				settings,
				stream,
				mediaRecorder,
				recordedChunks,
				recordingId,
			};

			// Set up event handlers
			mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
				if (!event.data.size) return;
				recordedChunks.push(event.data);
			});

			// Start recording
			mediaRecorder.start(TIMESLICE_MS);
			return Ok(undefined);
		},

		stopRecording: async ({ sendStatus }) => {
			if (!activeRecording) {
				return Err({
					name: 'RecordingServiceError',
					message:
						'Cannot stop recording because no active recording session was found. Make sure you have started recording before attempting to stop it.',
					context: {},
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
				mapError: (error): RecordingServiceError => ({
					name: 'RecordingServiceError',
					message:
						'Failed to properly stop and save the recording. This might be due to corrupted audio data, insufficient storage space, or a browser issue. Your recording data may be lost.',
					context: {
						recordingId: recording.recordingId,
						chunksCount: recording.recordedChunks.length,
						mimeType: recording.mediaRecorder.mimeType,
						state: recording.mediaRecorder.state,
					},
					cause: error,
				}),
			});

			// Always clean up the stream
			for (const track of recording.stream.getTracks()) {
				track.stop();
			}

			if (stopError) return Err(stopError);

			sendStatus({
				title: '✅ Recording Saved',
				description: 'Your recording is ready for transcription!',
			});
			return Ok(blob);
		},

		cancelRecording: async ({ sendStatus }) => {
			if (!activeRecording) {
				return Err({
					name: 'RecordingServiceError',
					message:
						'Cannot cancel recording because no active recording session was found. There is currently nothing to cancel.',
					context: {},
					cause: undefined,
				});
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
			for (const track of recording.stream.getTracks()) {
				track.stop();
			}

			sendStatus({
				title: '✨ Cancelled',
				description: 'Recording discarded successfully!',
			});

			return Ok(undefined);
		},
	});
}

async function getRecordingStream(
	settings: RecordingSessionSettings,
	setSettingsDeviceId: (deviceId: string) => void,
	sendStatus: (args: { title: string; description: string }) => void,
): Promise<Result<MediaStream, RecordingServiceError>> {
	const hasPreferredDevice = !!settings.selectedAudioInputDeviceId;

	// Try to use the preferred device if specified
	if (hasPreferredDevice && settings.selectedAudioInputDeviceId) {
		sendStatus({
			title: '🎯 Connecting Device',
			description:
				'Almost there! Just need your permission to use the microphone...',
		});
		const { data: preferredStream, error: getPreferredStreamError } =
			await getStreamForDeviceId(settings.selectedAudioInputDeviceId);
		if (!getPreferredStreamError) {
			return Ok(preferredStream);
		}
	}

	// Need to fall back to any available device
	const needsFallbackStream = !hasPreferredDevice;
	const preferredDeviceFailed = hasPreferredDevice;

	if (needsFallbackStream) {
		sendStatus({
			title: '🔍 No Device Selected',
			description:
				"No worries! We'll find the best microphone for you automatically...",
		});
	} else if (preferredDeviceFailed) {
		sendStatus({
			title: '⚠️ Finding a New Microphone',
			description:
				"That microphone isn't working. Let's try finding another one...",
		});
	}

	// Get fallback stream
	const { data: fallbackStreamData, error: getFallbackStreamError } =
		await getFirstAvailableStream();
	if (getFallbackStreamError) {
		const errorMessage = needsFallbackStream
			? "Hmm... We couldn't find any microphones to use. Check your connections and try again!"
			: "We couldn't connect to any microphones. Make sure they're plugged in and try again!";
		return Err({
			name: 'RecordingServiceError',
			message: errorMessage,
			context: { settings },
			cause: getFallbackStreamError,
		});
	}

	const { stream: fallbackStream, deviceId: fallbackDeviceId } =
		fallbackStreamData;

	// Update settings with the fallback device
	if (needsFallbackStream) {
		setSettingsDeviceId(fallbackDeviceId);
		toast.info({
			title: '🎙️ Switched to different microphone',
			description:
				'You had no microphone selected, so we automatically connected to an available one. You can update your microphone selection in settings.',
			action: {
				type: 'link',
				label: 'Open Settings',
				goto: '/settings/recording',
			},
		});
	} else if (preferredDeviceFailed) {
		setSettingsDeviceId(fallbackDeviceId);
		toast.info({
			title: '🎙️ Switched to different microphone',
			description:
				"Your previously selected microphone wasn't found, so we automatically connected to an available one. You can update your microphone selection in settings.",
			action: {
				type: 'link',
				label: 'Open Settings',
				goto: '/settings/recording',
			},
		});
	}

	return Ok(fallbackStream);
}

async function hasExistingAudioPermission(): Promise<boolean> {
	try {
		const permissions = await navigator.permissions.query({
			name: 'microphone' as PermissionName,
		});
		return permissions.state === 'granted';
	} catch {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: WHISPER_RECOMMENDED_MEDIA_TRACK_CONSTRAINTS,
			});
			for (const track of stream.getTracks()) {
				track.stop();
			}
			return true;
		} catch {
			return false;
		}
	}
}

async function getFirstAvailableStream() {
	const { data: recordingDevices, error: enumerateDevicesError } =
		await enumerateRecordingDevices();
	if (enumerateDevicesError)
		return Err({
			name: 'RecordingServiceError',
			message:
				'Error enumerating recording devices and acquiring first available stream. Please make sure you have given permission to access your audio devices',
			context: {},
			cause: enumerateDevicesError,
		});
	for (const device of recordingDevices) {
		const { data: stream, error: getStreamForDeviceIdError } =
			await getStreamForDeviceId(device.deviceId);
		if (!getStreamForDeviceIdError) {
			return Ok({ stream, deviceId: device.deviceId });
		}
	}
	return Err({
		name: 'RecordingServiceError',
		message: 'Unable to connect to your selected microphone',
		context: {},
		cause: undefined,
	});
}

async function enumerateRecordingDevices(): Promise<
	Result<MediaDeviceInfo[], RecordingServiceError>
> {
	const hasPermission = await hasExistingAudioPermission();
	if (!hasPermission) {
		extension.openWhisperingTab({});
	}
	return tryAsync({
		try: async () => {
			const allAudioDevicesStream = await navigator.mediaDevices.getUserMedia({
				audio: WHISPER_RECOMMENDED_MEDIA_TRACK_CONSTRAINTS,
			});
			const devices = await navigator.mediaDevices.enumerateDevices();
			for (const track of allAudioDevicesStream.getTracks()) {
				track.stop();
			}
			const audioInputDevices = devices.filter(
				(device) => device.kind === 'audioinput',
			);
			return audioInputDevices;
		},
		mapError: (error) => ({
			name: 'RecordingServiceError',
			message:
				'We need permission to see your microphones. Check your browser settings and try again.',
			context: {},
			cause: error,
		}),
	});
}

async function getStreamForDeviceId(recordingDeviceId: string) {
	const hasPermission = await hasExistingAudioPermission();
	if (!hasPermission) {
		extension.openWhisperingTab({});
	}
	return tryAsync({
		try: async () => {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					...WHISPER_RECOMMENDED_MEDIA_TRACK_CONSTRAINTS,
					deviceId: { exact: recordingDeviceId },
				},
			});
			return stream;
		},
		mapError: (error): RecordingServiceError => ({
			name: 'RecordingServiceError',
			message:
				'Unable to connect to the selected microphone. This could be because the device is already in use by another application, has been disconnected, or lacks proper permissions. Please check that your microphone is connected, not being used elsewhere, and that you have granted microphone permissions.',
			context: {
				recordingDeviceId,
				hasPermission,
			},
			cause: error,
		}),
	});
}