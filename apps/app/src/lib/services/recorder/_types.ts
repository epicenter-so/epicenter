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
	) => Promise<Result<void, RecordingServiceError>>;
	stopRecording: (callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}) => Promise<Result<Blob, RecordingServiceError>>;
	cancelRecording: (callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}) => Promise<Result<void, RecordingServiceError>>;
};
