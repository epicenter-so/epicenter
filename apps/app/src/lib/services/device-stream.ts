import { WHISPER_RECOMMENDED_MEDIA_TRACK_CONSTRAINTS } from '$lib/constants/audio';
import { Err, Ok, type Result, tryAsync } from 'wellcrafted/result';
import { createTaggedError } from 'wellcrafted/error';

const { DeviceStreamServiceError, DeviceStreamServiceErr } = createTaggedError(
	'DeviceStreamServiceError',
);
type DeviceStreamServiceError = ReturnType<typeof DeviceStreamServiceError>;

export type DeviceAcquisitionOutcome =
	| {
			outcome: 'success';
	  }
	| {
			outcome: 'fallback';
			reason: 'no-device-selected' | 'preferred-device-unavailable';
			fallbackDeviceId: string;
	  };

export type UpdateStatusMessageFn = (args: {
	title: string;
	description: string;
}) => void;

export async function hasExistingAudioPermission(): Promise<boolean> {
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

export async function enumerateRecordingDevices(): Promise<
	Result<MediaDeviceInfo[], DeviceStreamServiceError>
> {
	const hasPermission = await hasExistingAudioPermission();
	if (!hasPermission) {
		// extension.openWhisperingTab({});
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
		mapError: (error) => DeviceStreamServiceError({
			message:
				'We need permission to see your microphones. Check your browser settings and try again.',
			context: { permissionRequired: 'microphone' },
			cause: error,
		}),
	});
}

export async function getStreamForDeviceId(recordingDeviceId: string) {
	const hasPermission = await hasExistingAudioPermission();
	if (!hasPermission) {
		// extension.openWhisperingTab({});
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
		mapError: (error) => DeviceStreamServiceError({
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

export async function getRecordingStream(
	selectedDeviceId: string | null,
	sendStatus: UpdateStatusMessageFn,
): Promise<
	Result<
		{ stream: MediaStream; deviceOutcome: DeviceAcquisitionOutcome },
		DeviceStreamServiceError
	>
> {
	// Try preferred device first if specified
	if (!selectedDeviceId) {
		// No device selected
		sendStatus({
			title: '🔍 No Device Selected',
			description:
				"No worries! We'll find the best microphone for you automatically...",
		});
	} else {
		sendStatus({
			title: '🎯 Connecting Device',
			description:
				'Almost there! Just need your permission to use the microphone...',
		});

		const { data: preferredStream, error: getPreferredStreamError } =
			await getStreamForDeviceId(selectedDeviceId);

		if (!getPreferredStreamError) {
			return Ok({
				stream: preferredStream,
				deviceOutcome: { outcome: 'success' },
			});
		}

		// We reach here if the preferred device failed, so we'll fall back to the first available device
		sendStatus({
			title: '⚠️ Finding a New Microphone',
			description:
				"That microphone isn't working. Let's try finding another one...",
		});
	}

	// Try to get any available device as fallback
	const getFirstAvailableStream = async (): Promise<
		Result<{ stream: MediaStream; deviceId: string }, DeviceStreamServiceError>
	> => {
		const { data: recordingDevices, error: enumerateDevicesError } =
			await enumerateRecordingDevices();
		if (enumerateDevicesError)
			return DeviceStreamServiceErr({
				message:
					'Error enumerating recording devices and acquiring first available stream. Please make sure you have given permission to access your audio devices',
				cause: enumerateDevicesError,
			});

		for (const device of recordingDevices) {
			const { data: stream, error } = await getStreamForDeviceId(
				device.deviceId,
			);
			if (!error) {
				return Ok({ stream, deviceId: device.deviceId });
			}
		}

		return DeviceStreamServiceErr({
			message: 'Unable to connect to any available microphone',
			context: { recordingDevices },
			cause: undefined,
		});
	};

	// Get fallback stream
	const { data: fallbackStreamData, error: getFallbackStreamError } =
		await getFirstAvailableStream();
	if (getFallbackStreamError) {
		const errorMessage = selectedDeviceId
			? "We couldn't connect to any microphones. Make sure they're plugged in and try again!"
			: "Hmm... We couldn't find any microphones to use. Check your connections and try again!";
		return DeviceStreamServiceErr({
			message: errorMessage,
			context: { selectedDeviceId },
			cause: getFallbackStreamError,
		});
	}

	const { stream: fallbackStream, deviceId: fallbackDeviceId } =
		fallbackStreamData;

	// Return the stream with appropriate device outcome
	if (!selectedDeviceId) {
		return Ok({
			stream: fallbackStream,
			deviceOutcome: {
				outcome: 'fallback',
				reason: 'no-device-selected',
				fallbackDeviceId,
			},
		});
	}
	return Ok({
		stream: fallbackStream,
		deviceOutcome: {
			outcome: 'fallback',
			reason: 'preferred-device-unavailable',
			fallbackDeviceId,
		},
	});
}

export function cleanupRecordingStream(stream: MediaStream) {
	for (const track of stream.getTracks()) {
		track.stop();
	}
}