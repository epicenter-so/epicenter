import { Ok } from '@epicenterhq/result';
import type { HttpService } from '../http/HttpService';
import type { TranscriptionService } from './TranscriptionService';
import { createWhisperService } from './createWhisperService';

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
