import { Err, type Ok } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import type { Settings } from '@repo/shared/settings';
import type { HttpServiceError } from '../http/HttpService';

export type TranscriptionServiceError = WhisperingError;
export type TranscriptionServiceResult<T> =
	| Ok<T>
	| Err<TranscriptionServiceError>;

export type TranscriptionService = {
	transcribe: (
		audioBlob: Blob,
		options: {
			prompt: string;
			temperature: string;
			outputLanguage: Settings['transcription.outputLanguage'];
		},
	) => Promise<TranscriptionServiceResult<string>>;
};

export function HttpServiceErrIntoTranscriptionServiceErr(
	error: HttpServiceError,
): Err<WhisperingError> {
	switch (error.code) {
		case 'NetworkError': {
			const { error: origErr, code } = error;
			return Err({
				_tag: 'WhisperingError',
				variant: 'error',
				title: '🌐 Network Connection Failed',
				description:
					origErr instanceof Error
						? `Unable to reach the transcription service: ${origErr.message} (${code}). Please check your internet connection and try again.`
						: 'Unable to establish a connection to our transcription service. This could be due to a firewall, VPN, or network connectivity issue.',
				action: { type: 'more-details', error: origErr },
			});
		}

		case 'HttpError': {
			const status = error.status;

			if (status === 401) {
				return Err({
					_tag: 'WhisperingError',
					variant: 'error',
					title: '🔑 Authentication Failed',
					description:
						'Your current API key is invalid or has expired. Head to settings to enter a valid key and continue transcribing!',
					// action: { type: 'more-details', error: error.error },
					action: {
						type: 'link',
						label: 'Go to settings',
						goto: '/settings/transcription',
					},
				});
			}

			if (status === 403) {
				return Err({
					_tag: 'WhisperingError',
					variant: 'error',
					title: '⛔ Access Denied',
					description:
						"You don't have permission to use this service. This could be due to account restrictions or exceeded usage limits.",
					action: { type: 'more-details', error: error.error },
				});
			}

			if (status === 413) {
				return Err({
					_tag: 'WhisperingError',
					variant: 'error',
					title: '📦 Audio File Too Large',
					description:
						'The audio file exceeds the maximum size limit. Try splitting it into smaller segments or reducing the audio quality.',
					action: { type: 'more-details', error: error.error },
				});
			}

			if (status === 415) {
				return Err({
					_tag: 'WhisperingError',
					variant: 'error',
					title: '🎵 Unsupported Audio Format',
					description:
						'The audio file format is not supported. Please use MP3, WAV, or other common audio formats.',
					action: { type: 'more-details', error: error.error },
				});
			}

			// Rate limiting
			if (status === 429) {
				return Err({
					_tag: 'WhisperingError',
					variant: 'error',
					title: '⏳ Rate Limit Exceeded',
					description:
						"You've made too many requests. Please wait a moment before trying again or upgrade your plan for higher limits.",
					action: { type: 'more-details', error: error.error },
				});
			}

			if (status >= 500) {
				return Err({
					_tag: 'WhisperingError',
					variant: 'error',
					title: '🔧 Server Error',
					description: `The transcription service is experiencing technical difficulties (Error ${status}).`,
					action: { type: 'more-details', error: error.error },
				});
			}

			return Err({
				_tag: 'WhisperingError',
				variant: 'error',
				title: '❌ Request Failed',
				description: `The transcription request failed with status ${status}. This might be temporary - please try again.`,
				action: { type: 'more-details', error: error.error },
			});
		}

		case 'ParseError':
			return Err({
				_tag: 'WhisperingError',
				variant: 'error',
				title: '🔍 Invalid Response',
				description:
					error.error instanceof Error
						? `The transcription service returned an unexpected response format: ${error.error.message}. This might indicate an API version mismatch.`
						: "The transcription service response couldn't be processed. This might be due to a service upgrade or temporary issue.",
				action: { type: 'more-details', error: error.error },
			});

		default:
			return Err({
				_tag: 'WhisperingError',
				variant: 'error',
				title: '❓ Unexpected Error',
				description:
					'An unexpected error occurred during transcription. Please try again or contact support if the issue persists.',
				action: { type: 'more-details' },
			});
	}
}
