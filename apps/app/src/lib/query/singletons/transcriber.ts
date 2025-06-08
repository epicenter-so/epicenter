import { createResultMutation } from '@tanstack/svelte-query';
import type { Recording } from '$lib/services/db';
import { playSoundIfEnabled, services } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import { getContext, setContext } from 'svelte';
import { queryClient } from '..';
import { recordings } from '../recordings';
import { maybeCopyAndPaste } from './maybeCopyAndPaste';

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

function createTranscriber() {
	const updateRecording = createResultMutation(recordings.updateRecording());

	const transcribeRecording = createResultMutation(() => ({
		mutationKey: transcriberKeys.transcribe,
		onMutate: ({
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
			updateRecording.mutate(
				{ ...recording, transcriptionStatus: 'TRANSCRIBING' },
				{
					onError: (error) => {
						toast.warning({
							title:
								'⚠️ Unable to set recording transcription status to transcribing',
							description: 'Continuing with the transcription process...',
							action: { type: 'more-details', error },
						});
					},
				},
			);
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

			await updateRecording.mutateAsync(
				{ ...recording, transcribedText },
				{
					onError: (error) => {
						toast.error({
							title: '⚠️ Unable to update recording after transcription',
							description:
								"Transcription completed but unable to update recording's transcribed text in database",
							action: { type: 'more-details', error },
						});
					},
				},
			);

			return Ok(transcribedText);
		},
		onError: (error, { recording, toastId }) => {
			toast.error({ id: toastId, ...error });
			updateRecording.mutate(
				{ ...recording, transcriptionStatus: 'FAILED' },
				{
					onError: (error) => {
						toast.error({
							title: '⚠️ Unable to set recording transcription status to failed',
							description:
								'Transcription failed and failed again to update recording transcription status to failed',
							action: { type: 'more-details', error },
						});
					},
				},
			);
		},
		onSuccess: (transcribedText, { recording, toastId }) => {
			updateRecording.mutate(
				{ ...recording, transcribedText, transcriptionStatus: 'DONE' },
				{
					onError: (error) => {
						toast.error({
							title: '⚠️ Unable to update recording after transcription',
							description:
								"Transcription completed but unable to update recording's transcribed text and status in database",
							action: { type: 'more-details', error },
						});
					},
				},
			);
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
		transcribeRecording,
	};
}
