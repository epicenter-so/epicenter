import type { WhisperingError } from '$lib/result';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Err, Ok, type Result } from '@epicenterhq/result';
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

			try {
				// Create file from blob
				const file = new File(
					[audioBlob],
					`recording.${getExtensionFromAudioBlob(audioBlob)}`,
					{ type: audioBlob.type },
				);

				// Make the transcription request
				const transcription = await client.audio.transcriptions.create({
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
				});

				return Ok(transcription.text.trim());
			} catch (error) {
				// Handle Groq SDK errors
				if (error instanceof Groq.APIError) {
					const { status } = error;

					if (status === 401) {
						return Err({
							name: 'WhisperingError',
							title: '🔑 Authentication Required',
							description:
								'Your API key appears to be invalid or expired. Please update your API key in settings to continue transcribing.',
							action: {
								type: 'link',
								label: 'Update API key',
								goto: '/settings/transcription',
							},
							context: {},
							cause: error,
						} satisfies WhisperingError);
					}

					if (status === 403) {
						return Err({
							name: 'WhisperingError',
							title: '⛔ Access Restricted',
							description:
								"Your account doesn't have access to this feature. This may be due to plan limitations or account restrictions. Please check your account status.",
							action: { type: 'more-details', error },
							context: {},
							cause: error,
						} satisfies WhisperingError);
					}

					if (status === 413) {
						return Err({
							name: 'WhisperingError',
							title: '📦 Audio File Too Large',
							description:
								'Your audio file exceeds the maximum size limit (typically 25MB). Try splitting it into smaller segments or reducing the audio quality.',
							action: { type: 'more-details', error },
							context: {},
							cause: error,
						} satisfies WhisperingError);
					}

					if (status === 415) {
						return Err({
							name: 'WhisperingError',
							title: '🎵 Unsupported Format',
							description:
								"This audio format isn't supported. Please convert your file to MP3, WAV, M4A, or another common audio format.",
							action: { type: 'more-details', error },
							context: {},
							cause: error,
						} satisfies WhisperingError);
					}

					if (status === 429) {
						return Err({
							name: 'WhisperingError',
							title: '⏱️ Rate Limit Reached',
							description:
								error.message || 'Too many requests. Please try again later.',
							action: { type: 'more-details', error },
							context: {},
							cause: error,
						} satisfies WhisperingError);
					}

					if (status && status >= 500) {
						return Err({
							name: 'WhisperingError',
							title: '🔧 Service Unavailable',
							description: `The transcription service is temporarily unavailable (Error ${status}). Please try again in a few minutes.`,
							action: { type: 'more-details', error },
							context: {},
							cause: error,
						} satisfies WhisperingError);
					}

					return Err({
						name: 'WhisperingError',
						title: '❌ Request Failed',
						description: `The request failed with error ${status}. ${error.message || 'Please try again.'}`,
						action: { type: 'more-details', error },
						context: {},
						cause: error,
					} satisfies WhisperingError);
				}

				// Handle connection errors
				if (error instanceof TypeError && error.message.includes('fetch')) {
					return Err({
						name: 'WhisperingError',
						title: '🌐 Connection Issue',
						description:
							'Unable to connect to the transcription service. This could be a network issue or temporary service interruption. Please try again in a moment.',
						action: { type: 'more-details', error },
						context: {},
						cause: error,
					} satisfies WhisperingError);
				}

				// Handle any other errors
				return Err({
					name: 'WhisperingError',
					title: '🔧 Groq Service Error',
					description:
						error instanceof Error
							? error.message
							: 'An unexpected error occurred during transcription.',
					action: { type: 'more-details', error },
					context: {},
					cause: error instanceof Error ? error : undefined,
				} satisfies WhisperingError);
			}
		},
	};
}
