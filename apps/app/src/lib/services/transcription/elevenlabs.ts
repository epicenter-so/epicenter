import type { ElevenLabsModel } from '$lib/constants/transcription';
import type { WhisperingError } from '$lib/result';
import type { Settings } from '$lib/settings';
import { Err, Ok, type Result } from '@epicenterhq/result';
import { ElevenLabsClient } from 'elevenlabs';

export function createElevenLabsTranscriptionService() {
	return {
		transcribe: async (
			audioBlob: Blob,
			options: {
				prompt: string;
				temperature: string;
				outputLanguage: Settings['transcription.outputLanguage'];
				apiKey: string;
				model: (string & {}) | ElevenLabsModel;
			},
		): Promise<Result<string, WhisperingError>> => {
			if (!options.apiKey) {
				return Err({
					name: 'WhisperingError',
					title: '🔑 API Key Required',
					description:
						'Please enter your ElevenLabs API key in settings to use speech-to-text transcription.',
					action: {
						type: 'link',
						label: 'Add API key',
						goto: '/settings/transcription',
					},
				} satisfies WhisperingError);
			}

			try {
				const client = new ElevenLabsClient({
					apiKey: options.apiKey,
				});

				// Check file size
				const blobSizeInMb = audioBlob.size / (1024 * 1024);
				const MAX_FILE_SIZE_MB = 1000; // ElevenLabs allows files up to 1GB

				if (blobSizeInMb > MAX_FILE_SIZE_MB) {
					return Err({
						name: 'WhisperingError',
						title: '📁 File Size Too Large',
						description: `Your audio file (${blobSizeInMb.toFixed(1)}MB) exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please use a smaller file or compress the audio.`,
					} satisfies WhisperingError);
				}

				// Use the client's speechToText functionality
				const transcription = await client.speechToText.convert({
					file: audioBlob,
					model_id: options.model,
					// Map outputLanguage if not set to 'auto'
					language_code:
						options.outputLanguage !== 'auto'
							? options.outputLanguage
							: undefined,
					tag_audio_events: false,
					diarize: true,
				});

				// Return the transcribed text
				return Ok(transcription.text.trim());
			} catch (error) {
				return Err({
					name: 'WhisperingError',
					title: '🔧 Transcription Failed',
					description:
						'Unable to complete the transcription using ElevenLabs. This may be due to a service issue or unsupported audio format. Please try again.',
					action: { type: 'more-details', error },
				} satisfies WhisperingError);
			}
		},
	};
}

export type ElevenLabsTranscriptionService = ReturnType<
	typeof createElevenLabsTranscriptionService
>;

export const elevenlabsTranscriptionServiceLive =
	createElevenLabsTranscriptionService();
