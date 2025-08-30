import type { Settings } from '$lib/settings';

import { WhisperingErr, type WhisperingError } from '$lib/result';
import { ElevenLabsClient } from 'elevenlabs';
import { Ok, type Result } from 'wellcrafted/result';

export const ELEVENLABS_TRANSCRIPTION_MODELS = [
	{
		description:
			"World's most accurate transcription model with 96.7% accuracy for English. Supports 99 languages with word-level timestamps and speaker diarization.",
		cost: '$0.40/hour',
		name: 'scribe_v1',
	},
	{
		description:
			'Experimental version of Scribe with latest features and improvements. May include cutting-edge capabilities but with potential instability.',
		cost: '$0.40/hour',
		name: 'scribe_v1_experimental',
	},
] as const;

export type ElevenLabsModel = (typeof ELEVENLABS_TRANSCRIPTION_MODELS)[number];

export type ElevenLabsTranscriptionService = ReturnType<
	typeof createElevenLabsTranscriptionService
>;

export function createElevenLabsTranscriptionService() {
	return {
		transcribe: async (
			audioBlob: Blob,
			options: {
				apiKey: string;
				modelName: ElevenLabsModel['name'] | (string & {});
				outputLanguage: Settings['transcription.outputLanguage'];
				prompt: string;
				temperature: string;
			},
		): Promise<Result<string, WhisperingError>> => {
			if (!options.apiKey) {
				return WhisperingErr({
					title: '🔑 API Key Required',
					description:
						'Please enter your ElevenLabs API key in settings to use speech-to-text transcription.',
					action: {
						href: '/settings/transcription',
						label: 'Add API key',
						type: 'link',
					},
				});
			}

			try {
				const client = new ElevenLabsClient({
					apiKey: options.apiKey,
				});

				// Check file size
				const blobSizeInMb = audioBlob.size / (1024 * 1024);
				const MAX_FILE_SIZE_MB = 1000; // ElevenLabs allows files up to 1GB

				if (blobSizeInMb > MAX_FILE_SIZE_MB) {
					return WhisperingErr({
						title: '📁 File Size Too Large',
						description: `Your audio file (${blobSizeInMb.toFixed(1)}MB) exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please use a smaller file or compress the audio.`,
					});
				}

				// Use the client's speechToText functionality
				const transcription = await client.speechToText.convert({
					diarize: true,
					file: audioBlob,
					// Map outputLanguage if not set to 'auto'
					language_code:
						options.outputLanguage !== 'auto'
							? options.outputLanguage
							: undefined,
					model_id: options.modelName,
					tag_audio_events: false,
				});

				// Return the transcribed text
				return Ok(transcription.text.trim());
			} catch (error) {
				return WhisperingErr({
					title: '🔧 Transcription Failed',
					description:
						'Unable to complete the transcription using ElevenLabs. This may be due to a service issue or unsupported audio format. Please try again.',
					action: { error, type: 'more-details' },
				});
			}
		},
	};
}

export const ElevenlabsTranscriptionServiceLive =
	createElevenLabsTranscriptionService();
