import type { Recording } from '$lib/services/db';
import {
	DbRecordingsService,
	playSoundIfEnabled,
	services,
} from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, type Result } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import { createResultMutation } from '@tanstack/svelte-query';
import { getContext, setContext } from 'svelte';
import { queryClient } from '..';
import { maybeCopyAndPaste } from './maybeCopyAndPaste';
import type { Transformer } from './transformer';
import { nanoid } from 'nanoid/non-secure';

export type Transcriber = ReturnType<typeof createTranscriber>;

export const initTranscriberInContext = () => {
	const transcriber = createTranscriber();
	setContext('transcriber', transcriber);
	return transcriber;
};

export const getTranscriberFromContext = () => {
	return getContext<Transcriber>('transcriber');
};

const transcriberKeys = {
	transcribe: ['transcriber', 'transcribe'] as const,
	transform: ['transcriber', 'transform'] as const,
} as const;

function createTranscriber({
	transformer,
}: {
	transformer: Transformer;
}) {
	const transcribeRecording = createResultMutation(() => ({
		mutationKey: transcriberKeys.transcribe,
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
		}): Promise<Result<string, WhisperingError>> => {
			if (!recording.blob) {
				return Err({
					name: 'WhisperingError',
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to transcribe.",
					context: { recording },
					cause: new Error('Recording blob not found'),
				} satisfies WhisperingError);
			}
			const { data: transcribedText, error: transcriptionError } =
				await services.transcription.transcribe(recording.blob, {
					outputLanguage: settings.value['transcription.outputLanguage'],
					prompt: settings.value['transcription.prompt'],
					temperature: settings.value['transcription.temperature'],
				});
			if (transcriptionError) {
				if (transcriptionError.name === 'WhisperingError')
					return Err(transcriptionError);
				return Err({
					name: 'WhisperingError',
					title: '⚠️ Transcription error',
					description: 'Your recording could not be transcribed.',
					action: { type: 'more-details', error: transcriptionError },
					context: { recording },
					cause: transcriptionError,
				} satisfies WhisperingError);
			}

			const { error: setRecordingTranscribedTextError } =
				await DbRecordingsService.updateRecording({
					...recording,
					transcribedText,
				});
			if (setRecordingTranscribedTextError) {
				toast.error({
					title: '⚠️ Unable to update recording after transcription',
					description:
						"Transcription completed but unable to update recording's transcribed text in database",
					action: {
						type: 'more-details',
						error: setRecordingTranscribedTextError,
					},
				});
			}

			return Ok(transcribedText);
		},
		onError: async (error, { recording, toastId }) => {
			toast.error({ id: toastId, ...error });
			const { error: setRecordingFailedError } =
				await DbRecordingsService.updateRecording({
					...recording,
					transcriptionStatus: 'FAILED',
				});
			if (setRecordingFailedError) {
				toast.error({
					title: '⚠️ Unable to set recording transcription status to failed',
					description:
						'Transcription failed and failed again to update recording transcription status to failed',
					action: { type: 'more-details', error: setRecordingFailedError },
				});
			}
		},
		onSuccess: async (transcribedText, { recording, toastId }) => {
			const { error: setRecordingDoneError } =
				await DbRecordingsService.updateRecording({
					...recording,
					transcribedText,
					transcriptionStatus: 'DONE',
				});
			if (setRecordingDoneError) {
				toast.error({
					title: '⚠️ Unable to update recording after transcription',
					description:
						"Transcription completed but unable to update recording's transcribed text and status in database",
					action: { type: 'more-details', error: setRecordingDoneError },
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
	}));

	return {
		get isCurrentlyTranscribing() {
			return (
				queryClient.isMutating({
					mutationKey: transcriberKeys.transcribe,
				}) > 0
			);
		},
		transcribeRecording: transcribeRecording.mutate,
		transcribeThenTransformRecording: ({
			toastId,
			recording,
		}: {
			toastId: string;
			recording: Recording;
		}) => {
			transcribeRecording.mutate(
				{ recording, toastId },
				{
					onSuccess: () => {
						if (settings.value['transformations.selectedTransformationId']) {
							const transformToastId = nanoid();
							transformer.transformRecording.mutate({
								recordingId: recording.id,
								transformationId:
									settings.value['transformations.selectedTransformationId'],
								toastId: transformToastId,
							});
						}
					},
				},
			);
		},
	};
}
