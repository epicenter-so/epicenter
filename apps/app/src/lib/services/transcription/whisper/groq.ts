import { Err, Ok } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import type { TranscriptionService } from '../_types';
import type { HttpService } from '../../http/_types';
import { createWhisperService } from './_createWhisperService';

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

			return Ok(undefined);
		},
		errorConfig: {
			title: '🔧 Groq Service Error',
			description:
				'The Groq transcription service encountered an issue. This is typically a temporary problem on their end.',
		},
	});
}
