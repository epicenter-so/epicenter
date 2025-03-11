import type {
	MaybePromise,
	WhisperingRecordingState,
	WhisperingResult,
} from '@repo/shared';

export type UpdateStatusMessageFn = (args: {
	title: string;
	description: string;
}) => void;

export type RecordingSessionSettings = {
	deviceId: string | null;
	bitsPerSecond: number;
};

export type RecorderService = {
	getRecorderState: () => MaybePromise<
		WhisperingResult<WhisperingRecordingState>
	>;
	enumerateRecordingDevices: () => Promise<
		WhisperingResult<Pick<MediaDeviceInfo, 'deviceId' | 'label'>[]>
	>;
	ensureRecordingSession: (
		settings: RecordingSessionSettings,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<WhisperingResult<void>>;
	closeRecordingSession: (callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}) => Promise<WhisperingResult<void>>;
	startRecording: (
		recordingId: string,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<WhisperingResult<void>>;
	stopRecording: (callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}) => Promise<WhisperingResult<Blob>>;
	cancelRecording: (callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}) => Promise<WhisperingResult<void>>;
};
