import type { Result, TaggedError } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import type { Settings } from '$lib/settings';

export type TranscriptionServiceError =
	TaggedError<'TranscriptionServiceError'>;

export type TranscriptionService = {
	transcribe: (
		audioBlob: Blob,
		options: {
			prompt: string;
			temperature: string;
			outputLanguage: Settings['transcription.outputLanguage'];
		},
	) => Promise<Result<string, TranscriptionServiceError | WhisperingError>>;
};
