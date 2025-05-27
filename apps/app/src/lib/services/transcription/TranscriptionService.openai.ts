import { Err, Ok } from '@epicenterhq/result';
import { WhisperingError } from '@repo/shared';
import type { HttpService } from '../http/HttpService';
import type { TranscriptionService } from './TranscriptionService';
import { createWhisperService } from './createWhisperService';

export function createOpenaiTranscriptionService({
	HttpService,
	apiKey,
}: {
	HttpService: HttpService;
	apiKey: string;
}): TranscriptionService {
	return createWhisperService({
		HttpService,
		modelName: 'whisper-1',
		postConfig: {
			url: 'https://api.openai.com/v1/audio/transcriptions',
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
		},
		preValidate: async () => {
			if (!apiKey) {
				return Err(
					WhisperingError({
						title: 'OpenAI API Key not provided.',
						description: 'Please enter your OpenAI API key in the settings',
						action: {
							type: 'link',
							label: 'Go to settings',
							goto: '/settings/transcription',
						},
					}),
				);
			}

			if (!apiKey.startsWith('sk-')) {
				return Err(
					WhisperingError({
						title: 'Invalid OpenAI API Key',
						description: 'The OpenAI API Key must start with "sk-"',
						action: {
							type: 'link',
							label: 'Update OpenAI API Key',
							goto: '/settings/transcription',
						},
					}),
				);
			}

			return Ok(undefined);
		},
		errorConfig: {
			title: 'Server error from Whisper API',
			description: 'This is likely a problem with OpenAI, not you.',
		},
	});
}
