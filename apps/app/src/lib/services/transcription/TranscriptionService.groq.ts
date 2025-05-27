import { Err, Ok } from '@epicenterhq/result';
import { WhisperingError } from '@repo/shared';
import type { HttpService } from '../http/HttpService';
import type { TranscriptionService } from './TranscriptionService';
import { createWhisperService } from './createWhisperService';

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

export function createGroqTranscriptionService({
	HttpService,
	apiKey,
	modelName,
}: {
	HttpService: HttpService;
	apiKey: string;
	modelName: ModelName;
}): TranscriptionService {
	return createWhisperService({
		HttpService,
		modelName,
		postConfig: {
			url: 'https://api.groq.com/openai/v1/audio/transcriptions',
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
		},
		preValidate: async () => {
			if (!apiKey) {
				return Err(
					WhisperingError({
						title: 'Groq API Key not provided.',
						description: 'Please enter your Groq API key in the settings',
						action: {
							type: 'link',
							label: 'Go to settings',
							goto: '/settings/transcription',
						},
					}),
				);
			}

			if (!apiKey.startsWith('gsk_')) {
				return Err(
					WhisperingError({
						title: 'Invalid Groq API Key',
						description: 'The Groq API Key must start with "gsk_"',
						action: {
							type: 'link',
							label: 'Update API Key',
							goto: '/settings/transcription',
						},
					}),
				);
			}

			return Ok(undefined);
		},
		errorConfig: {
			title: 'Server error from Groq API',
			description: 'This is likely a problem with Groq, not you.',
		},
	});
}
