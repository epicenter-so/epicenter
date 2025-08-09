import type { CancelRecordingResult } from '$lib/constants/audio';
import { createTaggedError } from 'wellcrafted/error';
import type { Result } from 'wellcrafted/result';
import type {
	DeviceIdentifier,
	DeviceAcquisitionOutcome,
	UpdateStatusMessageFn,
} from '../types';

/**
 * Base error type for recorder services
 */
export const { RecorderServiceError, RecorderServiceErr } = createTaggedError(
	'RecorderServiceError',
);
export type RecorderServiceError = ReturnType<typeof RecorderServiceError>;

/**
 * Base parameters shared across all platforms
 */
type BaseRecordingParams = {
	selectedDeviceId: DeviceIdentifier | null;
	recordingId: string;
};

/**
 * Desktop-specific recording parameters
 */
export type DesktopRecordingParams = BaseRecordingParams & {
	platform: 'desktop';
	outputFolder: string | null;
	sampleRate: string;
};

/**
 * Web-specific recording parameters
 */
export type WebRecordingParams = BaseRecordingParams & {
	platform: 'web';
	bitrateKbps: string;
};

/**
 * Discriminated union for recording parameters based on platform
 */
export type StartRecordingParams = DesktopRecordingParams | WebRecordingParams;

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
	 * Enumerate available recording device identifiers
	 */
	enumerateRecordingDeviceIds(): Promise<
		Result<DeviceIdentifier[], RecorderServiceError>
	>;

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
