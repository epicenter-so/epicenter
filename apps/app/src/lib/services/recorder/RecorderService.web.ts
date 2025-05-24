import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import { WhisperingError, type WhisperingResult } from '@repo/shared';
import type { Settings } from '@repo/shared/settings';
import type { RecorderService, UpdateStatusMessageFn } from './RecorderService';

const TIMESLICE_MS = 1000;
// Whisper API recommends a mono channel at 16kHz
const WHISPER_RECOMMENDED_MEDIA_TRACK_CONSTRAINTS = {
	channelCount: { ideal: 1 },
	sampleRate: { ideal: 16_000 },
} satisfies MediaTrackConstraints;

type RecordingSession = {
	settings: Settings;
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
		settings: Settings,
		{ sendStatus }: { sendStatus: UpdateStatusMessageFn },
	): Promise<WhisperingResult<MediaStream>> => {
		if (!settings['recording.navigator.selectedAudioInputDeviceId']) {
			sendStatus({
				title: '🔍 No Device Selected',
				description:
					"No worries! We'll find the best microphone for you automatically...",
			});
			const { data: firstStream, error: getFirstStreamError } =
				await getFirstAvailableStream();
			if (getFirstStreamError) {
				return Err(
					WhisperingError({
						title: '🚫 Stream Error',
						description:
							"Hmm... We couldn't find any microphones to use. Check your connections and try again!",
						action: { type: 'more-details', error: getFirstStreamError },
					}),
				);
			}
			return Ok(firstStream);
		}
		sendStatus({
			title: '🎯 Connecting Device',
			description:
				'Almost there! Just need your permission to use the microphone...',
		});
		const { data: preferredStream, error: getPreferredStreamError } =
			await getStreamForDeviceId(
				settings['recording.navigator.selectedAudioInputDeviceId'],
			);
		if (getPreferredStreamError) {
			sendStatus({
				title: '⚠️ Finding a New Microphone',
				description:
					"That microphone isn't working. Let's try finding another one...",
			});
			const { data: firstStream, error: getFirstStreamError } =
				await getFirstAvailableStream();
			if (getFirstStreamError) {
				return Err(
					WhisperingError({
						title: '🎤 No Microphone Found',
						description:
							"We couldn't connect to any microphones. Make sure they're plugged in and try again!",
						action: { type: 'more-details', error: getFirstStreamError },
					}),
				);
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

		ensureRecordingSession: async (settings, { sendStatus }) => {
			if (maybeCurrentSession) return Ok(undefined);
			const { data: stream, error: acquireStreamError } = await acquireStream(
				settings,
				{
					sendStatus,
				},
			);
			if (acquireStreamError) return Err(acquireStreamError);
			maybeCurrentSession = { settings, stream, recorder: null };
			return Ok(undefined);
		},

		closeRecordingSession: async ({ sendStatus }) => {
			if (!maybeCurrentSession) return Ok(undefined);
			const currentSession = maybeCurrentSession;
			sendStatus({
				title: '🎙️ Cleaning Up',
				description:
					'Safely stopping your audio stream to free up system resources...',
			});
			for (const track of currentSession.stream.getTracks()) {
				track.stop();
			}
			sendStatus({
				title: '🧹 Almost Done',
				description:
					'Cleaning up recording resources and preparing for next session...',
			});
			maybeCurrentSession.recorder = null;
			sendStatus({
				title: '✨ All Set',
				description:
					'Recording session successfully closed and resources freed',
			});
			maybeCurrentSession = null;
			return Ok(undefined);
		},

		startRecording: async (recordingId, { sendStatus }) => {
			if (!maybeCurrentSession) {
				return Err(
					WhisperingError({
						title: '🚫 No Active Session',
						description:
							'Looks like we need to start a new recording session first!',
					}),
				);
			}
			const currentSession = maybeCurrentSession;
			if (!currentSession.stream.active) {
				sendStatus({
					title: '🔄 Session Expired',
					description:
						'Your recording session timed out. Reconnecting to your microphone...',
				});
				const { data: stream, error: acquireStreamError } = await acquireStream(
					currentSession.settings,
					{ sendStatus },
				);
				if (acquireStreamError) return Err(acquireStreamError);
				maybeCurrentSession = {
					settings: currentSession.settings,
					stream,
					recorder: null,
				};
			}
			sendStatus({
				title: '🎯 Getting Ready',
				description: 'Initializing your microphone and preparing to record...',
			});
			const { data: newRecorder, error: newRecorderError } = await tryAsync({
				try: async () => {
					return new MediaRecorder(currentSession.stream, {
						bitsPerSecond:
							Number(
								currentSession.settings['recording.navigator.bitrateKbps'],
							) * 1000,
					});
				},
				mapErr: (error) =>
					WhisperingError({
						title: '🎙️ Setup Failed',
						description:
							"Oops! Something went wrong with your microphone. Let's try that again!",
						action: { type: 'more-details', error },
					}),
			});
			if (newRecorderError) return Err(newRecorderError);
			sendStatus({
				title: '🎤 Recording Active',
				description:
					'Your microphone is now recording. Speak clearly and naturally!',
			});
			maybeCurrentSession.recorder = {
				mediaRecorder: newRecorder,
				recordedChunks: [],
				recordingId,
			};
			newRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
				if (!event.data.size) return;
				maybeCurrentSession?.recorder?.recordedChunks.push(event.data);
			});
			newRecorder.start(TIMESLICE_MS);
			return Ok(undefined);
		},

		stopRecording: async ({ sendStatus }) => {
			if (!maybeCurrentSession?.recorder) {
				return Err(
					WhisperingError({
						title: '⚠️ Nothing to Stop',
						description: 'No active recording found to stop',
						action: { type: 'more-details', error: undefined },
					}),
				);
			}
			const recorder = maybeCurrentSession.recorder;
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
				mapErr: (error) =>
					WhisperingError({
						title: '⏹️ Recording Stop Failed',
						description: 'Unable to save your recording. Please try again',
						action: { type: 'more-details', error },
					}),
			});
			if (stopError) return Err(stopError);
			sendStatus({
				title: '✅ Recording Complete',
				description: 'Successfully saved your audio recording!',
			});
			maybeCurrentSession.recorder = null;
			return Ok(blob);
		},

		cancelRecording: async ({ sendStatus }) => {
			if (!maybeCurrentSession?.recorder) {
				return Err(
					WhisperingError({
						title: '⚠️ Nothing to Cancel',
						description: 'No active recording found to cancel',
						action: { type: 'more-details', error: undefined },
					}),
				);
			}
			const recorder = maybeCurrentSession.recorder;
			sendStatus({
				title: '🛑 Cancelling',
				description: 'Safely cancelling your recording...',
			});
			recorder.mediaRecorder.stop();
			sendStatus({
				title: '✨ Cancelled',
				description: 'Recording successfully cancelled!',
			});
			maybeCurrentSession.recorder = null;
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
		return Err(
			WhisperingError({
				title:
					'Error enumerating recording devices and acquiring first available stream',
				description:
					'Please make sure you have given permission to access your audio devices',
				action: { type: 'more-details', error: enumerateDevicesError },
			}),
		);
	for (const device of recordingDevices) {
		const { data: stream, error: getStreamForDeviceIdError } =
			await getStreamForDeviceId(device.deviceId);
		if (!getStreamForDeviceIdError) {
			return Ok(stream);
		}
	}
	return Err(
		WhisperingError({
			title: '🎤 Microphone Access Error',
			description: 'Unable to connect to your selected microphone',
			action: { type: 'more-details', error: undefined },
		}),
	);
}

async function enumerateRecordingDevices() {
	const hasPermission = await hasExistingAudioPermission();
	if (!hasPermission) {
		void extension.openWhisperingTab({});
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
		mapErr: (error) =>
			WhisperingError({
				title: '🎤 Device Access Error',
				description:
					'Oops! We need permission to see your microphones. Check your browser settings and try again!',
				action: { type: 'more-details', error },
			}),
	});
}

async function getStreamForDeviceId(recordingDeviceId: string) {
	const hasPermission = await hasExistingAudioPermission();
	if (!hasPermission) {
		void extension.openWhisperingTab({});
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
		mapErr: (error) =>
			WhisperingError({
				title: '🎤 Microphone Access Error',
				description: 'Unable to connect to your selected microphone',
				action: { type: 'more-details', error },
			}),
	});
}
