import { Err, Ok } from '@epicenterhq/result';
import type { WhisperingError } from '$lib/result';
import type { TranscriptionService } from '.';
import { getExtensionFromAudioBlob } from '$lib/utils';
import OpenAI from 'openai';

const MAX_FILE_SIZE_MB = 25 as const;

export function createOpenaiTranscriptionService({
	apiKey,
}: {
	apiKey: string;
}): TranscriptionService {
	const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

	return {
		async transcribe(audioBlob, options) {
			// Pre-validation: Check API key
			if (!apiKey) {
				return Err({
					name: 'WhisperingError',
					title: '🔑 API Key Required',
					description:
						'Please enter your OpenAI API key in settings to use Whisper transcription.',
					action: {
						type: 'link',
						label: 'Add API key',
						goto: '/settings/transcription',
					},
					context: {},
					cause: undefined,
				} satisfies WhisperingError);
			}

			if (!apiKey.startsWith('sk-')) {
				return Err({
					name: 'WhisperingError',
					title: '🔑 Invalid API Key Format',
					description:
						'Your OpenAI API key should start with "sk-". Please check and update your API key.',
					action: {
						type: 'link',
						label: 'Update API key',
						goto: '/settings/transcription',
					},
					context: {},
					cause: undefined,
				} satisfies WhisperingError);
			}

			// Validate file size
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

			// Create File object from blob
			const file = new File(
				[audioBlob],
				`recording.${getExtensionFromAudioBlob(audioBlob)}`,
				{ type: audioBlob.type },
			);

			try {
				// Call OpenAI API
				const transcription = await client.audio.transcriptions.create({
					file,
					model: 'whisper-1',
					language:
						options.outputLanguage !== 'auto'
							? options.outputLanguage
							: undefined,
					prompt: options.prompt || undefined,
					temperature: options.temperature
						? Number.parseFloat(options.temperature)
						: undefined,
				});

				return Ok(transcription.text.trim());
			} catch (error) {
				// Handle OpenAI SDK errors
				if (error instanceof OpenAI.APIError) {
					const { status, message } = error;

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
							description: message,
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
						description: `The request failed with error ${status}. This may be temporary - please try again. If the problem persists, please contact support.`,
						action: { type: 'more-details', error },
						context: {},
						cause: error,
					} satisfies WhisperingError);
				}

				if (error instanceof OpenAI.APIConnectionError) {
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

				// Generic error handling
				return Err({
					name: 'WhisperingError',
					title: '🔧 OpenAI Service Error',
					description:
						error instanceof Error
							? error.message
							: 'An unexpected error occurred during transcription. Please try again.',
					action: { type: 'more-details', error },
					context: {},
					cause: error instanceof Error ? error : undefined,
				} satisfies WhisperingError);
			}
		},
	};
}
