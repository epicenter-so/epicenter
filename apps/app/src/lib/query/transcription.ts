import type { Recording } from '$lib/services/db';
import {
	DbRecordingsService,
	playSoundIfEnabled,
	services,
} from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, partitionResults } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import type { CreateResultMutationOptions } from '@tanstack/svelte-query';
import { maybeCopyAndPaste } from './singletons/maybeCopyAndPaste';
import type { TranscriptionServiceError } from '$lib/services/transcription/_types';
import { nanoid } from 'nanoid/non-secure';

export const transcriptionKeys = {
	all: ['transcription'] as const,
	transcribe: ['transcription', 'transcribe'] as const,
} as const;

export const transcription = {
	transcribeRecording: () =>
		({
			mutationKey: transcriptionKeys.transcribe,
			onMutate: async ({
				recording,
				toastId,
			}: {
				recording: Recording;
				toastId: string;
			}) => {
				toast.loading({
					id: toastId,
					title: '📋 Transcribing...',
					description: 'Your recording is being transcribed...',
				});
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
			},
			mutationFn: async ({
				recording,
			}: {
				recording: Recording;
				toastId: string;
			}) => {
				if (!recording.blob) {
					return Err({
						name: 'WhisperingError',
						title: '⚠️ Recording blob not found',
						description: "Your recording doesn't have a blob to transcribe.",
						context: { recording },
						cause: undefined,
					} satisfies WhisperingError);
				}
				return await services.transcription.transcribe(recording.blob, {
					outputLanguage: settings.value['transcription.outputLanguage'],
					prompt: settings.value['transcription.prompt'],
					temperature: settings.value['transcription.temperature'],
				});
			},
			onError: async (error, { toastId }) => {
				if (error.name === 'WhisperingError') {
					toast.error(error);
					return;
				}
				toast.error({
					id: toastId,
					title: '❌ Failed to transcribe recording',
					description: 'Your recording could not be transcribed.',
					action: { type: 'more-details', error: error },
				});
			},
			onSuccess: async (transcribedText, { recording, toastId }) => {
				const { error: setRecordingTranscribedTextError } =
					await DbRecordingsService.updateRecording({
						...recording,
						transcribedText,
						transcriptionStatus: 'DONE',
					});
				if (setRecordingTranscribedTextError) {
					toast.error({
						title: '⚠️ Unable to update recording after transcription',
						description:
							"Transcription completed but unable to update recording's transcribed text and status in database",
						action: {
							type: 'more-details',
							error: setRecordingTranscribedTextError,
						},
					});
				}
				void playSoundIfEnabled('transcriptionComplete');
				maybeCopyAndPaste({
					text: transcribedText,
					toastId,
					shouldCopy: settings.value['transcription.clipboard.copyOnSuccess'],
					shouldPaste: settings.value['transcription.clipboard.pasteOnSuccess'],
					statusToToastText(status) {
						switch (status) {
							case null:
								return '📝 Recording transcribed!';
							case 'COPIED':
								return '📝 Recording transcribed and copied to clipboard!';
							case 'COPIED+PASTED':
								return '📝📋✍️ Recording transcribed, copied to clipboard, and pasted!';
						}
					},
				});
			},
		}) satisfies CreateResultMutationOptions<
			string,
			WhisperingError | TranscriptionServiceError,
			{
				recording: Recording;
				toastId: string;
			}
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
