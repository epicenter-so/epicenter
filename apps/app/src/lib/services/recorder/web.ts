import { Err, Ok, type Result, tryAsync } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import type {
	RecorderService,
	RecordingServiceError,
	RecordingSessionSettings,
	UpdateStatusMessageFn,
} from './_types';

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

export function createRecorderServiceWeb(): RecorderService {
	let maybeCurrentSession: RecordingSession | null = null;

	const acquireStream = async (
		settings: RecordingSessionSettings,
		{ sendStatus }: { sendStatus: UpdateStatusMessageFn },
	): Promise<Result<MediaStream, RecordingServiceError>> => {
		if (!settings.selectedAudioInputDeviceId) {
			sendStatus({
				title: '🔍 No Device Selected',
				description:
					"No worries! We'll find the best microphone for you automatically...",
			});
			const { data: firstStream, error: getFirstStreamError } =
				await getFirstAvailableStream();
			if (getFirstStreamError) {
				return Err({
					name: 'RecordingServiceError',
					message:
						"Hmm... We couldn't find any microphones to use. Check your connections and try again!",
					context: { settings },
					cause: getFirstStreamError,
				});
			}
			return Ok(firstStream);
		}
		sendStatus({
			title: '🎯 Connecting Device',
			description:
				'Almost there! Just need your permission to use the microphone...',
		});
		const { data: preferredStream, error: getPreferredStreamError } =
			await getStreamForDeviceId(settings.selectedAudioInputDeviceId);
		if (getPreferredStreamError) {
			sendStatus({
				title: '⚠️ Finding a New Microphone',
				description:
					"That microphone isn't working. Let's try finding another one...",
			});
			const { data: firstStream, error: getFirstStreamError } =
				await getFirstAvailableStream();
			if (getFirstStreamError) {
				return Err({
					name: 'RecordingServiceError',
					message:
						"We couldn't connect to any microphones. Make sure they're plugged in and try again!",
					context: { settings },
					cause: getFirstStreamError,
				});
			}
			return Ok(firstStream);
		}
		return Ok(preferredStream);
	};

	return {
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
			const isSessionSettingsSame = (recordingSession: RecordingSession) =>
				recordingSession.settings.selectedAudioInputDeviceId ===
					settings.selectedAudioInputDeviceId &&
				recordingSession.settings.bitrateKbps === settings.bitrateKbps;

			// Do I need a new session?
			const needsNewSession =
				!maybeCurrentSession ||
				!maybeCurrentSession.stream.active ||
				!isSessionSettingsSame(maybeCurrentSession);

			if (needsNewSession) {
				// I need a new session. What's my situation?
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
					// currentSession exists and is active, so settings must be wrong
					sendStatus({
						title: '🔄 Updating Settings',
						description: 'Audio settings changed, creating new session...',
					});
					for (const track of maybeCurrentSession.stream.getTracks()) {
						track.stop();
					}
				}

				// Get what I need
				const { data: stream, error: acquireStreamError } = await acquireStream(
					settings,
					{ sendStatus },
				);
				if (acquireStreamError) return Err(acquireStreamError);

				maybeCurrentSession = { settings, stream, recorder: null };
			}

			const { data: newRecorder, error: newRecorderError } = await tryAsync({
				try: async () => {
					return new MediaRecorder(maybeCurrentSession!.stream, {
						bitsPerSecond:
							Number(maybeCurrentSession!.settings.bitrateKbps) * 1000,
					});
				},
				mapError: (error): RecordingServiceError => ({
					name: 'RecordingServiceError',
					message:
						'Failed to initialize the audio recorder. This could be due to unsupported audio settings, microphone conflicts, or browser limitations. Please check your microphone is working and try adjusting your audio settings.',
					context: {
						recordingId,
						bitrateKbps: maybeCurrentSession!.settings.bitrateKbps,
						streamActive: maybeCurrentSession!.stream.active,
						streamTracks: maybeCurrentSession!.stream.getTracks().length,
					},
					cause: error,
				}),
			});
			if (newRecorderError) return Err(newRecorderError);

			// Create recorder object synchronously before starting
			maybeCurrentSession!.recorder = {
				mediaRecorder: newRecorder,
				recordedChunks: [],
				recordingId,
			};

			newRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
				if (!event.data.size) return;
				maybeCurrentSession!.recorder?.recordedChunks.push(event.data);
			});

			newRecorder.start(TIMESLICE_MS);
			return Ok(undefined);
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
	};
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
			return Ok(stream);
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
