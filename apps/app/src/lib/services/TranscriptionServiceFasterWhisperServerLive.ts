import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { TranscriptionService, WhisperingError } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { MainLive } from '.';
import { HttpService } from './HttpService';
import { HttpServiceDesktopLive } from './HttpServiceDesktopLive';
import { HttpServiceWebLive } from './HttpServiceWebLive';
import { WhisperResponseSchema } from './transcription/WhisperResponseSchema';

const MAX_FILE_SIZE_MB = 25 as const;

export const TranscriptionServiceFasterWhisperServerLive = Layer.succeed(
	TranscriptionService,
	TranscriptionService.of({
		transcribe: (audioBlob) =>
			Effect.gen(function* () {
				const httpService = yield* HttpService;
				const {
					outputLanguage,
					fasterWhisperServerUrl,
					fasterWhisperServerModel,
				} = settings.value;

				const formDataFile = new File(
					[audioBlob],
					`recording.${getExtensionFromAudioBlob(audioBlob)}`,
					{ type: audioBlob.type },
				);
				const formData = new FormData();
				formData.append('file', formDataFile);
				formData.append('model', fasterWhisperServerModel);
				if (outputLanguage !== 'auto')
					formData.append('language', outputLanguage);
				const data = yield* httpService
					.post({
						url: `${fasterWhisperServerUrl}/v1/audio/transcriptions`,
						formData,
						schema: WhisperResponseSchema,
					})
					.pipe(
						Effect.catchTags({
							ParseError: (error) =>
								new WhisperingError({
									title: 'Unable to parse transcription server response',
									description: 'Please try again',
									action: {
										type: 'more-details',
										error,
									},
								}),
							HttpServiceError: (error) =>
								new WhisperingError({
									title:
										'An error occurred while sending the request to the transcription server.',
									description: 'Please try again',
									action: {
										type: 'more-details',
										error,
									},
								}),
						}),
					);
				if ('error' in data) {
					return yield* new WhisperingError({
						title: 'faster-whisper-server error',
						description:
							'Please check your faster-whisper-server server settings',
						action: {
							type: 'more-details',
							error: data.error.message,
						},
					});
				}
				return data.text;
			}).pipe(Effect.provide(MainLive)),
	}),
);
