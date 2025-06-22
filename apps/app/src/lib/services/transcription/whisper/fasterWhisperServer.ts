import type { HttpService } from '$lib/services/http';
import { Ok } from '@epicenterhq/result';
import type { TranscriptionService } from '..';
import { createWhisperService } from './_createWhisperService';

export function createFasterWhisperServerTranscriptionService({
	HttpService,
	serverModel,
	serverUrl,
}: {
	HttpService: HttpService;
	serverModel: string;
	serverUrl: string;
}): TranscriptionService {
	return createWhisperService({
		HttpService,
		modelName: serverModel,
		postConfig: {
			url: `${serverUrl}/v1/audio/transcriptions`,
		},
		preValidate: async () => Ok(undefined),
		errorConfig: {
			title: '🔧 Server Connection Issue',
			description:
				'Unable to connect to your faster-whisper server. Please check that the server is running and your settings are correct.',
		},
	});
}
