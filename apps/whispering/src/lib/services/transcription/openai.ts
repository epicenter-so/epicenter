import type { Settings } from '$lib/settings';

import { WhisperingErr, type WhisperingError } from '$lib/result';
import { getExtensionFromAudioBlob } from '$lib/services/_utils';
import OpenAI from 'openai';
import { Err, Ok, type Result, tryAsync, trySync } from 'wellcrafted/result';

export const OPENAI_TRANSCRIPTION_MODELS = [
	{
		description:
			"OpenAI's flagship speech-to-text model with multilingual support. Reliable and accurate transcription for a wide variety of use cases.",
		cost: '$0.36/hour',
		name: 'whisper-1',
	},
	{
		description:
			'GPT-4o powered transcription with enhanced understanding and context. Best for complex audio requiring deep comprehension.',
		cost: '$0.36/hour',
		name: 'gpt-4o-transcribe',
	},
	{
		description:
			'Cost-effective GPT-4o mini transcription model. Good balance of performance and cost for standard transcription needs.',
		cost: '$0.18/hour',
		name: 'gpt-4o-mini-transcribe',
	},
] as const satisfies {
	cost: string;
	description: string;
	name: OpenAI.Audio.AudioModel;
}[];

export type OpenAIModel = (typeof OPENAI_TRANSCRIPTION_MODELS)[number];

const MAX_FILE_SIZE_MB = 25 as const;

export type OpenaiTranscriptionService = ReturnType<
	typeof createOpenaiTranscriptionService
>;

export function createOpenaiTranscriptionService() {
	return {
		async transcribe(
			audioBlob: Blob,
			options: {
				apiKey: string;
				modelName: OpenAIModel['name'] | (string & {});
				outputLanguage: Settings['transcription.outputLanguage'];
				prompt: string;
				temperature: string;
			},
		): Promise<Result<string, WhisperingError>> {
			// Pre-validation: Check API key
			if (!options.apiKey) {
				return WhisperingErr({
					title: '🔑 API Key Required',
					description:
						'Please enter your OpenAI API key in settings to use Whisper transcription.',
					action: {
						href: '/settings/transcription',
						label: 'Add API key',
						type: 'link',
					},
				});
			}

			if (!options.apiKey.startsWith('sk-')) {
				return WhisperingErr({
					title: '🔑 Invalid API Key Format',
					description:
						'Your OpenAI API key should start with "sk-". Please check and update your API key.',
					action: {
						href: '/settings/transcription',
						label: 'Update API key',
						type: 'link',
					},
				});
			}

			// Validate file size
			const blobSizeInMb = audioBlob.size / (1024 * 1024);
			if (blobSizeInMb > MAX_FILE_SIZE_MB) {
				return WhisperingErr({
					title: `The file size (${blobSizeInMb}MB) is too large`,
					description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
				});
			}

			// Create File object from blob
			const { data: file, error: fileError } = trySync({
				mapErr: (error) =>
					WhisperingErr({
						title: '📁 File Creation Failed',
						description:
							'Failed to create audio file for transcription. Please try again.',
					}),
				try: () =>
					new File(
						[audioBlob],
						`recording.${getExtensionFromAudioBlob(audioBlob)}`,
						{ type: audioBlob.type },
					),
			});

			if (fileError) return Err(fileError);

			// Call OpenAI API
			const { data: transcription, error: openaiApiError } = await tryAsync({
				mapErr: (error) => {
					// Check if it's NOT an OpenAI API error
					if (!(error instanceof OpenAI.APIError)) {
						// This is an unexpected error type
						throw error;
					}
					// Return the error directly
					return Err(error);
				},
				try: () =>
					new OpenAI({
						apiKey: options.apiKey,
						dangerouslyAllowBrowser: true,
					}).audio.transcriptions.create({
						file,
						language:
							options.outputLanguage !== 'auto'
								? options.outputLanguage
								: undefined,
						model: options.modelName,
						prompt: options.prompt || undefined,
						temperature: options.temperature
							? Number.parseFloat(options.temperature)
							: undefined,
					}),
			});

			if (openaiApiError) {
				// Error handling follows https://www.npmjs.com/package/openai#error-handling
				const { message, error, name, status } = openaiApiError;

				// 400 - BadRequestError
				if (status === 400) {
					return WhisperingErr({
						title: '❌ Bad Request',
						description:
							message ??
							`Invalid request to OpenAI API. ${error?.message ?? ''}`.trim(),
						action: { error: openaiApiError, type: 'more-details' },
					});
				}

				// 401 - AuthenticationError
				if (status === 401) {
					return WhisperingErr({
						title: '🔑 Authentication Required',
						description:
							message ??
							'Your API key appears to be invalid or expired. Please update your API key in settings to continue transcribing.',
						action: {
							href: '/settings/transcription',
							label: 'Update API key',
							type: 'link',
						},
					});
				}

				// 403 - PermissionDeniedError
				if (status === 403) {
					return WhisperingErr({
						title: '⛔ Permission Denied',
						description:
							message ??
							"Your account doesn't have access to this feature. This may be due to plan limitations or account restrictions.",
						action: { error: openaiApiError, type: 'more-details' },
					});
				}

				// 404 - NotFoundError
				if (status === 404) {
					return WhisperingErr({
						title: '🔍 Not Found',
						description:
							message ??
							'The requested resource was not found. This might indicate an issue with the model or API endpoint.',
						action: { error: openaiApiError, type: 'more-details' },
					});
				}

				// 413 - Request Entity Too Large
				if (status === 413) {
					return WhisperingErr({
						title: '📦 Audio File Too Large',
						description:
							message ??
							'Your audio file exceeds the maximum size limit (25MB). Try splitting it into smaller segments or reducing the audio quality.',
						action: { error: openaiApiError, type: 'more-details' },
					});
				}

				// 415 - Unsupported Media Type
				if (status === 415) {
					return WhisperingErr({
						title: '🎵 Unsupported Format',
						description:
							message ??
							"This audio format isn't supported. Please convert your file to MP3, WAV, M4A, or another common audio format.",
						action: { error: openaiApiError, type: 'more-details' },
					});
				}

				// 422 - UnprocessableEntityError
				if (status === 422) {
					return WhisperingErr({
						title: '⚠️ Invalid Input',
						description:
							message ??
							'The request was valid but the server cannot process it. Please check your audio file and parameters.',
						action: { error: openaiApiError, type: 'more-details' },
					});
				}

				// 429 - RateLimitError
				if (status === 429) {
					return WhisperingErr({
						title: '⏱️ Rate Limit Reached',
						description:
							message ?? 'Too many requests. Please try again later.',
						action: {
							href: '/settings/transcription',
							label: 'Update API key',
							type: 'link',
						},
					});
				}

				// >=500 - InternalServerError
				if (status && status >= 500) {
					return WhisperingErr({
						title: '🔧 Service Unavailable',
						description:
							message ??
							`The transcription service is temporarily unavailable (Error ${status}). Please try again in a few minutes.`,
						action: { error: openaiApiError, type: 'more-details' },
					});
				}

				// Handle APIConnectionError (no status code)
				if (!status && name === 'APIConnectionError') {
					return WhisperingErr({
						title: '🌐 Connection Issue',
						description:
							message ??
							'Unable to connect to the OpenAI service. This could be a network issue or temporary service interruption.',
						action: { error: openaiApiError, type: 'more-details' },
					});
				}

				// Return the error directly for other API errors
				return WhisperingErr({
					title: '❌ Unexpected Error',
					description:
						message ?? 'An unexpected error occurred. Please try again.',
					action: { error: openaiApiError, type: 'more-details' },
				});
			}

			// Success - return the transcription text
			return Ok(transcription.text.trim());
		},
	};
}

export const OpenaiTranscriptionServiceLive =
	createOpenaiTranscriptionService();
