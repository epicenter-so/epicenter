import type { Result } from 'wellcrafted/result';

import { createTaggedError } from 'wellcrafted/error';
export const { FfmpegServiceErr, FfmpegServiceError } =
	createTaggedError('FfmpegServiceError');

export type FfmpegService = {
	/**
	 * Checks if FFmpeg is installed on the system.
	 * Returns Ok(true) if installed, Ok(false) if not installed.
	 */
	checkInstalled(): Promise<Result<boolean, FfmpegServiceError>>;
};

type FfmpegServiceError = ReturnType<typeof FfmpegServiceError>;
