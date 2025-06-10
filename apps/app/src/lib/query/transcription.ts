import type { Recording } from '$lib/services/db';
import {
	DbRecordingsService,
	playSoundIfEnabled,
	services,
} from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import type { TranscriptionServiceError } from '$lib/services/transcription/_types';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, partitionResults } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import type { CreateResultMutationOptions } from '@tanstack/svelte-query';
import { queryClient } from '.';

const transcriptionKeys = {
	transcribe: ['transcription', 'transcribe'] as const,
} as const;

export const transcription = {
	isCurrentlyTranscribing() {
		return (
			queryClient.isMutating({
				mutationKey: transcriptionKeys.transcribe,
			}) > 0
		);
	},
	transcribeRecording: {
		mutationKey: transcriptionKeys.transcribe,
		mutationFn: async (recording) => {
			if (!recording.blob) {
				return Err({
					name: 'WhisperingError',
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to transcribe.",
					context: { recording },
					cause: undefined,
				} satisfies WhisperingError);
			}
			const { error: setRecordingTranscribingError } =
				await DbRecordingsService.updateRecording({
					...recording,
					transcriptionStatus: 'TRANSCRIBING',
				});
			if (setRecordingTranscribingError) {
				toast.warning({
					title:
						'⚠️ Unable to set recording transcription status to transcribing',
					description: 'Continuing with the transcription process...',
					action: {
						type: 'more-details',
						error: setRecordingTranscribingError,
					},
				});
			}
			const { data: transcribedText, error: transcribeError } =
				await services.transcription.transcribe(recording.blob, {
					outputLanguage: settings.value['transcription.outputLanguage'],
					prompt: settings.value['transcription.prompt'],
					temperature: settings.value['transcription.temperature'],
				});
			if (transcribeError) {
				const { error: setRecordingTranscribingError } =
					await DbRecordingsService.updateRecording({
						...recording,
						transcriptionStatus: 'FAILED',
					});
				if (setRecordingTranscribingError) {
					toast.warning({
						title: '⚠️ Unable to update recording after transcription',
						description:
							"Transcription failed but unable to update recording's transcription status in database",
						action: {
							type: 'more-details',
							error: setRecordingTranscribingError,
						},
					});
				}
				return Err(transcribeError);
			}
			playSoundIfEnabled('transcriptionComplete');
			const { error: setRecordingTranscribedTextError } =
				await DbRecordingsService.updateRecording({
					...recording,
					transcribedText,
					transcriptionStatus: 'DONE',
				});
			if (setRecordingTranscribedTextError) {
				toast.warning({
					title: '⚠️ Unable to update recording after transcription',
					description:
						"Transcription completed but unable to update recording's transcribed text and status in database",
					action: {
						type: 'more-details',
						error: setRecordingTranscribedTextError,
					},
				});
			}
			return Ok(transcribedText);
		},
	} satisfies CreateResultMutationOptions<
		string,
		WhisperingError | TranscriptionServiceError,
		Recording
	>,

	transcribeRecordings: () =>
		({
			mutationKey: transcriptionKeys.transcribe,
			mutationFn: async (recordings) => {
				const results = await Promise.all(
					recordings.map((recording) => {
						if (!recording.blob) {
							return Err({
								name: 'WhisperingError',
								title: '⚠️ Recording blob not found',
								description:
									"Your recording doesn't have a blob to transcribe.",
								context: { recording },
								cause: undefined,
							} satisfies WhisperingError);
						}
						return services.transcription.transcribe(recording.blob, {
							outputLanguage: settings.value['transcription.outputLanguage'],
							prompt: settings.value['transcription.prompt'],
							temperature: settings.value['transcription.temperature'],
						});
					}),
				);
				const partitionedResults = partitionResults(results);
				return Ok(partitionedResults);
			},
		}) satisfies CreateResultMutationOptions<
			{
				oks: Ok<string>[];
				errs: Err<WhisperingError | TranscriptionServiceError>[];
			},
			never,
			Recording[]
		>,
};
