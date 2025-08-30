import type { CancelRecordingResult } from '$lib/constants/audio';
import type { Result } from 'wellcrafted/result';

import { createTaggedError } from 'wellcrafted/error';

import type {
	Device,
	DeviceAcquisitionOutcome,
	DeviceIdentifier,
	UpdateStatusMessageFn,
} from '../types';

/**
 * Base error type for recorder services
 */
export const { RecorderServiceErr, RecorderServiceError } = createTaggedError(
	'RecorderServiceError',
);
/**
 * Desktop-specific recording parameters
 */
export type DesktopRecordingParams = BaseRecordingParams & {
	outputFolder: null | string;
	platform: 'desktop';
	sampleRate: string;
};

/**
 * Unified recorder service interface that both desktop and web implementations must satisfy
 */
export type RecorderService = {
	/**
	 * Cancel the current recording without saving
	 */
	cancelRecording(callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}): Promise<Result<CancelRecordingResult, RecorderServiceError>>;

	/**
	 * Enumerate available recording devices with their labels and identifiers
	 */
	enumerateDevices(): Promise<
		Result<Device[], RecorderServiceError>
	>;

	/**
	 * Get the current recording ID if a recording is in progress
	 * Returns null if no recording is active
	 */
	getCurrentRecordingId(): Promise<Result<null | string, RecorderServiceError>>;

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
};

export type RecorderServiceError = ReturnType<typeof RecorderServiceError>;

/**
 * Discriminated union for recording parameters based on platform
 */
export type StartRecordingParams = DesktopRecordingParams | WebRecordingParams;

/**
 * Web-specific recording parameters
 */
export type WebRecordingParams = BaseRecordingParams & {
	bitrateKbps: string;
	platform: 'web';
};

/**
 * Base parameters shared across all platforms
 */
type BaseRecordingParams = {
	recordingId: string;
	selectedDeviceId: DeviceIdentifier | null;
};
