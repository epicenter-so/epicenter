import type { CancelRecordingResult } from '$lib/constants/audio';
import { createTaggedError } from 'wellcrafted/error';
import type { Result } from 'wellcrafted/result';
import type {
	Device,
	DeviceIdentifier,
	DeviceAcquisitionOutcome,
	UpdateStatusMessageFn,
} from '../types';
import type { TemplateString } from '$lib/utils/template';

/**
 * Base error type for recorder services
 */
export const { RecorderServiceError, RecorderServiceErr } = createTaggedError(
	'RecorderServiceError',
);
export type RecorderServiceError = ReturnType<typeof RecorderServiceError>;

/**
 * Base parameters shared across all implementations
 */
type BaseRecordingParams = {
	selectedDeviceId: DeviceIdentifier | null;
	recordingId: string;
};

/**
 * CPAL (native Rust) recording parameters
 */
export type CpalRecordingParams = BaseRecordingParams & {
	implementation: 'cpal';
	outputFolder: string | null;
	sampleRate: string;
};

/**
 * Navigator (MediaRecorder) recording parameters
 */
export type NavigatorRecordingParams = BaseRecordingParams & {
	implementation: 'navigator';
	bitrateKbps: string;
};

/**
 * FFmpeg recording parameters
 */
export type FfmpegRecordingParams = BaseRecordingParams & {
	implementation: 'ffmpeg';
	commandTemplate: TemplateString | null;
};

/**
 * Discriminated union for recording parameters based on implementation
 */
export type StartRecordingParams =
	| CpalRecordingParams
	| NavigatorRecordingParams
	| FfmpegRecordingParams;

/**
 * Unified recorder service interface that both desktop and web implementations must satisfy
 */
export type RecorderService = {
	/**
	 * Get the current recording ID if a recording is in progress
	 * Returns null if no recording is active
	 */
	getCurrentRecordingId(): Promise<Result<string | null, RecorderServiceError>>;

	/**
	 * Enumerate available recording devices with their labels and identifiers
	 */
	enumerateDevices(): Promise<Result<Device[], RecorderServiceError>>;

	/**
	 * Start a new recording session
	 */
	startRecording(
		params: StartRecordingParams,
		callbacks: {
			sendStatus: UpdateStatusMessageFn;
		},
	): Promise<Result<DeviceAcquisitionOutcome, RecorderServiceError>>;

	/**
	 * Stop the current recording and return the audio blob
	 */
	stopRecording(callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}): Promise<Result<Blob, RecorderServiceError>>;

	/**
	 * Cancel the current recording without saving
	 */
	cancelRecording(callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}): Promise<Result<CancelRecordingResult, RecorderServiceError>>;
};
