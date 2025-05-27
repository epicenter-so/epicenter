import { Err, Ok } from '@epicenterhq/result';
import { ElevenLabsClient } from 'elevenlabs';
import type {
	TranscriptionService,
	TranscriptionServiceResult,
} from './TranscriptionService';
import { WhisperingError } from '@repo/shared';

type ModelName = 'scribe_v1';

export function createElevenLabsTranscriptionService({
	apiKey,
	modelName = 'scribe_v1',
}: {
	apiKey: string;
	modelName?: ModelName;
}): TranscriptionService {
	return {
		transcribe: async (
			audioBlob,
			options,
		): Promise<TranscriptionServiceResult<string>> => {
			if (!apiKey) {
				return Err(
					WhisperingError({
						title: 'ElevenLabs API Key not provided',
						description: 'Please enter your ElevenLabs API key in the settings',
						action: {
							type: 'link',
							label: 'Go to settings',
							goto: '/settings/transcription',
						},
					}),
				);
			}

			try {
				const client = new ElevenLabsClient({
					apiKey,
				});

				// Check file size
				const blobSizeInMb = audioBlob.size / (1024 * 1024);
				const MAX_FILE_SIZE_MB = 1000; // ElevenLabs allows files up to 1GB

				if (blobSizeInMb > MAX_FILE_SIZE_MB) {
					return Err(
						WhisperingError({
							title: `The file size (${blobSizeInMb.toFixed(1)}MB) is too large`,
							description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
						}),
					);
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
				// Handle errors from the ElevenLabs client
				return Err(
					WhisperingError({
						title: 'Error with ElevenLabs Speech-to-Text',
						description:
							error instanceof Error
								? error.message
								: 'Failed to transcribe audio',
						action: { type: 'more-details', error },
					}),
				);
			}
		},
	};
}
