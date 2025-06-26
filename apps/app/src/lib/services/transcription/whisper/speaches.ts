import type { HttpService } from '$lib/services/http';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Err, Ok, type Result } from '@epicenterhq/result';
import type { WhisperingError } from '$lib/result';
import { z } from 'zod';
import type { TranscriptionService, TranscriptionServiceError } from '..';

const whisperApiResponseSchema = z.union([
	z.object({ text: z.string() }),
	z.object({ error: z.object({ message: z.string() }) }),
]);

const MAX_FILE_SIZE_MB = 25 as const;

export function createSpeachesTranscriptionService({
	HttpService,
	modelId,
	baseUrl,
}: {
	HttpService: HttpService;
	modelId: string;
	baseUrl: string;
}): TranscriptionService {
	return {
		transcribe: async (
			audioBlob,
			options,
		): Promise<Result<string, TranscriptionServiceError | WhisperingError>> => {
			const formData = new FormData();
			formData.append(
				'file',
				new File(
					[audioBlob],
					`recording.${getExtensionFromAudioBlob(audioBlob)}`,
					{ type: audioBlob.type },
				),
			);
			formData.append('model', modelId);
			if (options.outputLanguage !== 'auto') {
				formData.append('language', options.outputLanguage);
			}
			if (options.prompt) formData.append('prompt', options.prompt);
			if (options.temperature)
				formData.append('temperature', options.temperature);

			const { data: whisperApiResponse, error: postError } =
				await HttpService.post({
					url: `${baseUrl}/v1/audio/transcriptions`,
					body: formData,
					headers: undefined, // No headers needed for Speaches
					schema: whisperApiResponseSchema,
				});

			if (postError) {
				switch (postError.name) {
					case 'ConnectionError': {
						return Err({
							name: 'WhisperingError',
							title: '🌐 Connection Issue',
							description:
								'Unable to connect to the transcription service. This could be a network issue or temporary service interruption. Please try again in a moment.',
							action: { type: 'more-details', error: postError.cause },
							context: {},
							cause: postError.cause,
						} satisfies WhisperingError);
					}

					case 'ResponseError': {
						const { status, message } = postError;

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
								cause: postError.cause,
							} satisfies WhisperingError);
						}

						if (status === 403) {
							return Err({
								name: 'WhisperingError',
								title: '⛔ Access Restricted',
								description:
									"Your account doesn't have access to this feature. This may be due to plan limitations or account restrictions. Please check your account status.",
								action: { type: 'more-details', error: postError.cause },
								context: {},
								cause: postError,
							} satisfies WhisperingError);
						}

						if (status === 413) {
							return Err({
								name: 'WhisperingError',
								title: '📦 Audio File Too Large',
								description:
									'Your audio file exceeds the maximum size limit (typically 25MB). Try splitting it into smaller segments or reducing the audio quality.',
								action: { type: 'more-details', error: postError.cause },
								context: {},
								cause: postError,
							} satisfies WhisperingError);
						}

						if (status === 415) {
							return Err({
								name: 'WhisperingError',
								title: '🎵 Unsupported Format',
								description:
									"This audio format isn't supported. Please convert your file to MP3, WAV, M4A, or another common audio format.",
								action: { type: 'more-details', error: postError.cause },
								context: {},
								cause: postError,
							} satisfies WhisperingError);
						}

						// Rate limiting
						if (status === 429) {
							return Err({
								name: 'WhisperingError',
								title: '⏱️ Rate Limit Reached',
								description: message,
								action: { type: 'more-details', error: postError.cause },
								context: {},
								cause: postError,
							} satisfies WhisperingError);
						}

						if (status >= 500) {
							return Err({
								name: 'WhisperingError',
								title: '🔧 Service Unavailable',
								description: `The transcription service is temporarily unavailable (Error ${status}). Please try again in a few minutes.`,
								action: { type: 'more-details', error: postError.cause },
								context: {},
								cause: postError,
							} satisfies WhisperingError);
						}

						return Err({
							name: 'WhisperingError',
							title: '❌ Request Failed',
							description: `The request failed with error ${status}. This may be temporary - please try again. If the problem persists, please contact support.`,
							action: { type: 'more-details', error: postError.cause },
							context: {},
							cause: postError,
						} satisfies WhisperingError);
					}

					case 'ParseError':
						return Err({
							name: 'WhisperingError',
							title: '🔍 Response Error',
							description:
								'Received an unexpected response from the transcription service. This is usually temporary - please try again.',
							action: { type: 'more-details', error: postError.cause },
							context: {},
							cause: postError.cause,
						} satisfies WhisperingError);

					default:
						return Err({
							name: 'WhisperingError',
							title: '❓ Unexpected Error',
							description:
								'An unexpected error occurred during transcription. Please try again, and contact support if the issue continues.',
							action: { type: 'more-details', error: postError },
							context: {},
							cause: postError,
						} satisfies WhisperingError);
				}
			}

			if ('error' in whisperApiResponse) {
				return Err({
					name: 'WhisperingError',
					title: '🔧 Speaches Connection Issue',
					description: whisperApiResponse.error.message,
					context: {},
					cause: undefined,
				} satisfies WhisperingError);
			}

			return Ok(whisperApiResponse.text.trim());
		},
	};
}
