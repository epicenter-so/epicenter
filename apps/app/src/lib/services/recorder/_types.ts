import type { Result, TaggedError } from '@epicenterhq/result';
import type { MaybePromise, WhisperingRecordingState } from '@repo/shared';
import type { Settings } from '@repo/shared/settings';

export type UpdateStatusMessageFn = (args: {
	title: string;
	description: string;
}) => void;

export type RecordingSessionSettings = {
	deviceId: string | null;
	bitsPerSecond: number;
};

export type RecordingServiceError = TaggedError<'RecordingServiceError'>;

export type RecorderService = {
	getRecorderState: () => MaybePromise<
		Result<WhisperingRecordingState, RecordingServiceError>
	>;
	enumerateRecordingDevices: () => Promise<
		Result<Pick<MediaDeviceInfo, 'deviceId' | 'label'>[], RecordingServiceError>
	>;
	ensureRecordingSession: (
		settings: Settings,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<Result<void, RecordingServiceError>>;
	closeRecordingSession: (callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}) => Promise<Result<void, RecordingServiceError>>;
	startRecording: (
		recordingId: string,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<Result<void, RecordingServiceError>>;
	stopRecording: (callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}) => Promise<Result<Blob, RecordingServiceError>>;
	cancelRecording: (callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}) => Promise<Result<void, RecordingServiceError>>;
};
