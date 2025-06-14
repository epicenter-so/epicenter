import type { Result, TaggedError } from '@epicenterhq/result';
import type { MaybePromise, WhisperingRecordingState } from '@repo/shared';

export type UpdateStatusMessageFn = (args: {
	title: string;
	description: string;
}) => void;

export type RecordingSessionSettings = {
	selectedAudioInputDeviceId: string | null;
	bitrateKbps: string;
};

export type RecordingServiceError = TaggedError<'RecordingServiceError'>;

/**
 * Describes the outcome of device acquisition when starting a recording.
 *
 * @remarks
 * When starting a recording, we attempt to use the user's preferred device.
 * This type communicates whether we successfully acquired that device or
 * had to fall back to an alternative.
 *
 * @example
 * ```typescript
 * // Success case - got the device we wanted
 * { outcome: 'success' }
 *
 * // Fallback case - had to use a different device
 * {
 *   outcome: 'fallback',
 *   reason: 'preferred-device-unavailable',
 *   fallbackDeviceId: 'device-123'
 * }
 * ```
 */
export type DeviceAcquisitionOutcome =
	| {
			/** Successfully acquired the requested device (or default if none specified) */
			outcome: 'success';
	  }
	| {
			/** Had to use a fallback device instead of the requested one */
			outcome: 'fallback';
			/** Why we couldn't use the preferred device */
			reason: 'no-device-selected' | 'preferred-device-unavailable';
			/** The device ID we actually used */
			fallbackDeviceId: string;
	  };

export type RecorderService = {
	getRecorderState: () => MaybePromise<
		Result<WhisperingRecordingState, RecordingServiceError>
	>;
	enumerateRecordingDevices: () => Promise<
		Result<
			{ readonly deviceId: string; readonly label: string }[],
			RecordingServiceError
		>
	>;
	startRecording: (
		{ settings }: { settings: RecordingSessionSettings },
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<Result<DeviceAcquisitionOutcome, RecordingServiceError>>;
	stopRecording: (callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}) => Promise<Result<Blob, RecordingServiceError>>;
	cancelRecording: (callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}) => Promise<Result<void, RecordingServiceError>>;
};
