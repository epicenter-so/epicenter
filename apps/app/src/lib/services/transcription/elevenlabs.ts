import { Err, Ok } from '@epicenterhq/result';
import type { WhisperingError } from '$lib/result';
import { ElevenLabsClient } from 'elevenlabs';
import type { TranscriptionService } from '.';

type ModelName = 'scribe_v1';

export function createElevenLabsTranscriptionService({
	apiKey,
	modelName = 'scribe_v1',
}: {
	apiKey: string;
	modelName?: ModelName;
}): TranscriptionService {
	return {
		transcribe: async (audioBlob, options) => {
			if (!apiKey) {
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
					context: {},
					cause: undefined,
				} satisfies WhisperingError);
			}

			try {
				const client = new ElevenLabsClient({
					apiKey,
				});

				// Check file size
				const blobSizeInMb = audioBlob.size / (1024 * 1024);
				const MAX_FILE_SIZE_MB = 1000; // ElevenLabs allows files up to 1GB

				if (blobSizeInMb > MAX_FILE_SIZE_MB) {
					return Err({
						name: 'WhisperingError',
						title: '📁 File Size Too Large',
						description: `Your audio file (${blobSizeInMb.toFixed(1)}MB) exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please use a smaller file or compress the audio.`,
						context: {},
						cause: undefined,
					} satisfies WhisperingError);
				}

				// Use the client's speechToText functionality
				const transcription = await client.speechToText.convert({
					file: audioBlob,
					model_id: modelName,
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
					context: {},
					cause: error,
				} satisfies WhisperingError);
			}
		},
	};
}
