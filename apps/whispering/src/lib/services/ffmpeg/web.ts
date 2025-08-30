import type { WhisperingError } from '$lib/result';

import { Ok, type Result } from 'wellcrafted/result';

import type { FfmpegService } from './types';

export function createFfmpegServiceWeb(): FfmpegService {
	return {
		async checkInstalled(): Promise<Result<boolean, WhisperingError>> {
			// FFmpeg check is not available in web version, assume not installed
			return Ok(false);
		},
	};
}
