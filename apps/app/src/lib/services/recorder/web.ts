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

type RecordingSession = {
	settings: RecordingSessionSettings;
	stream: MediaStream;
	recorder: {
		mediaRecorder: MediaRecorder;
		recordedChunks: Blob[];
		recordingId: string;
	} | null;
};

export function createRecorderServiceWebFactory() {
	let maybeCurrentSession: RecordingSession | null = null;

	return ({
		setSettingsDeviceId,
	}: {
		setSettingsDeviceId: (deviceId: string) => void;
	}): RecorderService => ({
		getRecorderState: () => {
			if (!maybeCurrentSession) return Ok('IDLE');
			if (maybeCurrentSession.recorder) return Ok('SESSION+RECORDING');
			return Ok('SESSION');
		},
		enumerateRecordingDevices,

		closeRecordingSession: async ({ sendStatus }) => {
			if (!maybeCurrentSession) return Ok(undefined);

			sendStatus({
				title: '🧹 Cleaning Up',
				description:
					'Closing your audio stream and freeing system resources...',
			});

			// Stop recorder first if it exists
			if (maybeCurrentSession.recorder?.mediaRecorder.state === 'recording') {
				maybeCurrentSession.recorder.mediaRecorder.stop();
			}

			// Then stop tracks
			for (const track of maybeCurrentSession.stream.getTracks()) {
				track.stop();
			}

			maybeCurrentSession = null;

			return Ok(undefined);
		},

		startRecording: async ({ recordingId, settings }, { sendStatus }) => {
			const createAndStartRecorder = async (
				currentSession: RecordingSession,
			): Promise<Result<undefined, RecordingServiceError>> => {
				const { data: newRecorder, error: newRecorderError } = await tryAsync({
					try: async () => {
						return new MediaRecorder(currentSession.stream, {
							bitsPerSecond: Number(currentSession.settings.bitrateKbps) * 1000,
						});
					},
					mapError: (error): RecordingServiceError => ({
						name: 'RecordingServiceError',
						message:
							'Failed to initialize the audio recorder. This could be due to unsupported audio settings, microphone conflicts, or browser limitations. Please check your microphone is working and try adjusting your audio settings.',
						context: { recordingId, maybeCurrentSession },
						cause: error,
					}),
				});
				if (newRecorderError) return Err(newRecorderError);

				// Create recorder object synchronously before starting
				currentSession.recorder = {
					mediaRecorder: newRecorder,
					recordedChunks: [],
					recordingId,
				};

				newRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
					if (!event.data.size) return;
					currentSession.recorder?.recordedChunks.push(event.data);
				});

				newRecorder.start(TIMESLICE_MS);
				return Ok(undefined);
			};

			const isSessionSettingsSame = (recordingSession: RecordingSession) =>
				recordingSession.settings.selectedAudioInputDeviceId ===
					settings.selectedAudioInputDeviceId &&
				recordingSession.settings.bitrateKbps === settings.bitrateKbps;

			// Can I use what I already have? (happy path)
			if (
				maybeCurrentSession?.stream.active &&
				isSessionSettingsSame(maybeCurrentSession)
			) {
				return await createAndStartRecorder(maybeCurrentSession);
			}

			// If we reach here, I need a new session. What's my situation?
			if (!maybeCurrentSession) {
				sendStatus({
					title: '🎙️ Starting Session',
					description: 'Setting up recording environment...',
				});
			} else if (!maybeCurrentSession.stream.active) {
				sendStatus({
					title: '🔄 Reconnecting',
					description: 'Session expired, reconnecting to microphone...',
				});
			} else {
				// Settings must be different
				sendStatus({
					title: '🔄 Updating Settings',
					description: 'Audio settings changed, creating new session...',
				});
				for (const track of maybeCurrentSession.stream.getTracks()) {
					track.stop();
				}
			}

			// Clear the current session
			maybeCurrentSession = null;

			const getRecordingStream = async (): Promise<
				Result<MediaStream, RecordingServiceError>
			> => {
				const hasPreferredDevice = !!settings.selectedAudioInputDeviceId;

				// Can I use my preferred device?
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

				// What's my situation? I need a fallback stream
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

				// Take action: Get fallback stream
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
			};

			// Recreate the session
			const { data: stream, error: acquireStreamError } =
				await getRecordingStream();
			if (acquireStreamError) return Err(acquireStreamError);
			maybeCurrentSession = { settings, stream, recorder: null };

			// Create the recorder with the new session
			return await createAndStartRecorder(maybeCurrentSession);
		},

		stopRecording: async ({ sendStatus }) => {
			if (!maybeCurrentSession?.recorder) {
				return Err({
					name: 'RecordingServiceError',
					message:
						'Cannot stop recording because no active recording session was found. Make sure you have started recording before attempting to stop it.',
					context: {},
					cause: undefined,
				});
			}
			const recorder = maybeCurrentSession.recorder;

			// Clear recorder immediately
			maybeCurrentSession.recorder = null;

			sendStatus({
				title: '⏸️ Finishing Up',
				description:
					'Saving your recording and preparing the final audio file...',
			});
			const { data: blob, error: stopError } = await tryAsync({
				try: () =>
					new Promise<Blob>((resolve) => {
						recorder.mediaRecorder.addEventListener('stop', () => {
							const audioBlob = new Blob(recorder.recordedChunks, {
								type: recorder.mediaRecorder.mimeType,
							});
							resolve(audioBlob);
						});
						recorder.mediaRecorder.stop();
					}),
				mapError: (error): RecordingServiceError => ({
					name: 'RecordingServiceError',
					message:
						'Failed to properly stop and save the recording. This might be due to corrupted audio data, insufficient storage space, or a browser issue. Your recording data may be lost.',
					context: {
						recordingId: recorder.recordingId,
						chunksCount: recorder.recordedChunks.length,
						mimeType: recorder.mediaRecorder.mimeType,
						state: recorder.mediaRecorder.state,
					},
					cause: error,
				}),
			});
			if (stopError) return Err(stopError);
			sendStatus({
				title: '✅ Recording Complete',
				description: 'Successfully saved your audio recording!',
			});
			return Ok(blob);
		},

		cancelRecording: async ({ sendStatus }) => {
			if (!maybeCurrentSession?.recorder) {
				return Err({
					name: 'RecordingServiceError',
					message:
						'Cannot cancel recording because no active recording session was found. There is currently nothing to cancel.',
					context: {},
					cause: undefined,
				});
			}

			sendStatus({
				title: '🛑 Cancelling',
				description: 'Safely cancelling your recording...',
			});

			maybeCurrentSession.recorder.mediaRecorder.stop();
			maybeCurrentSession.recorder = null;

			sendStatus({
				title: '✨ Cancelled',
				description: 'Recording successfully cancelled!',
			});

			return Ok(undefined);
		},
	});
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
