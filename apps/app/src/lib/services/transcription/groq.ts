import type { WhisperingError } from '$lib/result';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Err, Ok, tryAsync, trySync, type Result } from '@epicenterhq/result';
import type { TranscriptionService, TranscriptionServiceError } from '.';

import Groq from 'groq-sdk';

type ModelName =
	/**
	 * Best accuracy (10.3% WER) and full multilingual support, including translation.
	 * Recommended for error-sensitive applications requiring multilingual support.
	 * Cost: $0.111/hour
	 */
	| 'whisper-large-v3'
	/**
	 * Fast multilingual model with good accuracy (12% WER).
	 * Best price-to-performance ratio for multilingual applications.
	 * Cost: $0.04/hour, 216x real-time processing
	 */
	| 'whisper-large-v3-turbo'
	/**
	 * Fastest and most cost-effective model, but English-only.
	 * Recommended for English transcription where speed and cost are priorities.
	 * Cost: $0.02/hour, 250x real-time processing, 13% WER
	 */
	| 'distil-whisper-large-v3-en';

const MAX_FILE_SIZE_MB = 25 as const;

export function createGroqTranscriptionService({
	apiKey,
	modelName,
}: {
	apiKey: string;
	modelName: ModelName;
}): TranscriptionService {
	const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });

	return {
		async transcribe(
			audioBlob,
			options,
		): Promise<Result<string, TranscriptionServiceError | WhisperingError>> {
			// Pre-validate API key
			if (!apiKey) {
				return Err({
					name: 'WhisperingError',
					title: '🔑 API Key Required',
					description: 'Please enter your Groq API key in settings.',
					action: {
						type: 'link',
						label: 'Add API key',
						goto: '/settings/transcription',
					},
					context: {},
					cause: undefined,
				} satisfies WhisperingError);
			}

			if (!apiKey.startsWith('gsk_')) {
				return Err({
					name: 'WhisperingError',
					title: '🔑 Invalid API Key Format',
					description:
						'Your Groq API key should start with "gsk_". Please check and update your API key.',
					action: {
						type: 'link',
						label: 'Update API key',
						goto: '/settings/transcription',
					},
					context: {},
					cause: undefined,
				} satisfies WhisperingError);
			}

			// Check file size
			const blobSizeInMb = audioBlob.size / (1024 * 1024);
			if (blobSizeInMb > MAX_FILE_SIZE_MB) {
				return Err({
					name: 'WhisperingError',
					title: `The file size (${blobSizeInMb}MB) is too large`,
					description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
					context: {},
					cause: undefined,
				});
			}

			// Create file from blob
			const { data: file, error: fileError } = trySync({
				try: () =>
					new File(
						[audioBlob],
						`recording.${getExtensionFromAudioBlob(audioBlob)}`,
						{ type: audioBlob.type },
					),
				mapError: (error) =>
					({
						name: 'WhisperingError' as const,
						title: '📄 File Creation Failed',
						description:
							'Failed to create audio file for transcription. Please try again.',
						action: { type: 'more-details', error },
						context: {},
						cause: error,
					}) satisfies WhisperingError,
			});

			if (fileError) return Err(fileError);

			// Make the transcription request
			const { data: transcription, error: groqApiError } = await tryAsync({
				try: () =>
					client.audio.transcriptions.create({
						file,
						model: modelName,
						language:
							options.outputLanguage === 'auto'
								? undefined
								: options.outputLanguage,
						prompt: options.prompt ? options.prompt : undefined,
						temperature: options.temperature
							? Number.parseFloat(options.temperature)
							: undefined,
					}),
				mapError: (error) => {
					// Check if it's NOT a Groq API error
					if (!(error instanceof Groq.APIError)) {
						// This is an unexpected error type
						throw error;
					}
					// Return the error directly
					return error;
				},
			});

			if (groqApiError) {
				// Error handling follows https://www.npmjs.com/package/groq-sdk#error-handling
				const { status, name, message, error } = groqApiError;

				// 400 - BadRequestError
				if (status === 400) {
					return Err({
						name: 'WhisperingError',
						title: '❌ Bad Request',
						description:
							message ??
							`Invalid request to Groq API. ${error?.message ?? ''}`.trim(),
						action: { type: 'more-details', error: groqApiError },
						context: {},
						cause: groqApiError,
					} satisfies WhisperingError);
				}

				// 401 - AuthenticationError
				if (status === 401) {
					return Err({
						name: 'WhisperingError',
						title: '🔑 Authentication Required',
						description:
							message ??
							'Your API key appears to be invalid or expired. Please update your API key in settings to continue transcribing.',
						action: {
							type: 'link',
							label: 'Update API key',
							goto: '/settings/transcription',
						},
						context: {},
						cause: groqApiError,
					} satisfies WhisperingError);
				}

				// 403 - PermissionDeniedError
				if (status === 403) {
					return Err({
						name: 'WhisperingError',
						title: '⛔ Permission Denied',
						description:
							message ??
							"Your account doesn't have access to this feature. This may be due to plan limitations or account restrictions.",
						action: { type: 'more-details', error: groqApiError },
						context: {},
						cause: groqApiError,
					} satisfies WhisperingError);
				}

				// 404 - NotFoundError
				if (status === 404) {
					return Err({
						name: 'WhisperingError',
						title: '🔍 Not Found',
						description:
							message ??
							'The requested resource was not found. This might indicate an issue with the model or API endpoint.',
						action: { type: 'more-details', error: groqApiError },
						context: {},
						cause: groqApiError,
					} satisfies WhisperingError);
				}

				// 422 - UnprocessableEntityError
				if (status === 422) {
					return Err({
						name: 'WhisperingError',
						title: '⚠️ Invalid Input',
						description:
							message ??
							'The request was valid but the server cannot process it. Please check your audio file and parameters.',
						action: { type: 'more-details', error: groqApiError },
						context: {},
						cause: groqApiError,
					} satisfies WhisperingError);
				}

				// 429 - RateLimitError
				if (status === 429) {
					return Err({
						name: 'WhisperingError',
						title: '⏱️ Rate Limit Reached',
						description:
							message ?? 'Too many requests. Please try again later.',
						action: { type: 'more-details', error: groqApiError },
						context: {},
						cause: groqApiError,
					} satisfies WhisperingError);
				}

				// >=500 - InternalServerError
				if (status && status >= 500) {
					return Err({
						name: 'WhisperingError',
						title: '🔧 Service Unavailable',
						description:
							message ??
							`The transcription service is temporarily unavailable (Error ${status}). Please try again in a few minutes.`,
						action: { type: 'more-details', error: groqApiError },
						context: {},
						cause: groqApiError,
					} satisfies WhisperingError);
				}

				// Handle APIConnectionError (no status code)
				if (!status && name === 'APIConnectionError') {
					return Err({
						name: 'WhisperingError',
						title: '🌐 Connection Issue',
						description:
							message ??
							'Unable to connect to the Groq service. This could be a network issue or temporary service interruption.',
						action: { type: 'more-details', error: groqApiError },
						context: {},
						cause: groqApiError,
					} satisfies WhisperingError);
				}

				// Return the error directly for other API errors
				return Err({
					name: 'WhisperingError',
					title: '❌ Unexpected Error',
					description:
						message ?? 'An unexpected error occurred. Please try again.',
					action: { type: 'more-details', error: groqApiError },
					context: {},
					cause: groqApiError,
				} satisfies WhisperingError);
			}

			return Ok(transcription.text.trim());
		},
	};
}
