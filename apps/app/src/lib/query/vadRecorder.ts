import { VadService, playSoundIfEnabled } from '$lib/services';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import type {
	CreateResultMutationOptions,
	CreateResultQueryOptions,
} from '@tanstack/svelte-query';
import { nanoid } from 'nanoid/non-secure';
import { executeMutation, queryClient } from '.';
import { recordings } from './recordings';
import { maybeCopyAndPaste } from './singletons/maybeCopyAndPaste';
import { transcription } from './transcription';
import { transformer } from './transformer';

const vadRecorderKeys = {
	all: ['vadRecorder'] as const,
	state: ['vadRecorder', 'state'] as const,
} as const;

const invalidateVadState = () =>
	queryClient.invalidateQueries({ queryKey: vadRecorderKeys.state });

export const vadRecorder = {
	getVadState: () =>
		({
			queryKey: vadRecorderKeys.state,
			queryFn: () => {
				const vadState = VadService.getVadState();
				return Ok(vadState);
			},
		}) satisfies CreateResultQueryOptions<string, never>,

	closeVadSession: () =>
		({
			mutationFn: async () => {
				const closeResult = await VadService.closeVad();
				return closeResult;
			},
			onSettled: invalidateVadState,
		}) satisfies CreateResultMutationOptions<any, any, void>,

	startActiveListening: () => ({
		onMutate: async () => {
			const { error: ensureVadError } = await VadService.ensureVad({
				deviceId:
					settings.value['recording.navigator.selectedAudioInputDeviceId'],
				onSpeechEnd: async (blob) => {
					const toastId = nanoid();
					toast.success({
						id: toastId,
						title: '🎙️ Voice activated speech captured',
						description: 'Your voice activated speech has been captured.',
					});
					console.info('Voice activated speech captured');
					playSoundIfEnabled('vad-capture');

					const now = new Date().toISOString();
					const newRecordingId = nanoid();

					const { data: createdRecording, error: createRecordingError } =
						await executeMutation(recordings.createRecording, {
							id: newRecordingId,
							title: '',
							subtitle: '',
							createdAt: now,
							updatedAt: now,
							timestamp: now,
							transcribedText: '',
							blob,
							transcriptionStatus: 'UNPROCESSED',
						});
					if (createRecordingError) {
						toast.error({
							id: toastId,
							title: '❌ Database Save Failed',
							description:
								'Your voice activated capture was captured but could not be saved to the database. Please check your storage space and permissions.',
							action: {
								type: 'more-details',
								error: createRecordingError,
							},
						});
						return;
					}
					toast.loading({
						id: toastId,
						title: '✨ Voice activated capture complete!',
						description: settings.value['recording.isFasterRerecordEnabled']
							? 'Voice activated capture complete! Ready for another take'
							: 'Voice activated capture complete! Session closed successfully',
					});

					const transcribeToastId = nanoid();
					toast.loading({
						id: transcribeToastId,
						title: '📋 Transcribing...',
						description: 'Your recording is being transcribed...',
					});
					const { error } = await executeMutation(
						transcription.transcribeRecording,
						createdRecording,
					);
					if (error) {
						if (error.name === 'WhisperingError') {
							toast.error({ id: transcribeToastId, ...error });
							return;
						}
						toast.error({
							id: transcribeToastId,
							title: '❌ Failed to transcribe recording',
							description: 'Your recording could not be transcribed.',
							action: { type: 'more-details', error: error },
						});
						return;
					}

					toast.success({
						id: transcribeToastId,
						title: 'Transcribed recording!',
						description: 'Your recording has been transcribed.',
					});
					maybeCopyAndPaste({
						text: transcribedText,
						toastId,
						shouldCopy: settings.value['transcription.clipboard.copyOnSuccess'],
						shouldPaste:
							settings.value['transcription.clipboard.pasteOnSuccess'],
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
					if (settings.value['transformations.selectedTransformationId']) {
						const transformToastId = nanoid();
						executeMutation(transformer.transformRecording, {
							recordingId: createdRecording.id,
							transformationId:
								settings.value['transformations.selectedTransformationId'],
							toastId: transformToastId,
						});
					}
				},
			});
			if (ensureVadError) {
				toast.error({
					id: toastId,
					title: '❌ Failed to start voice activated capture',
					description: 'Your voice activated capture could not be started.',
				});
				return;
			}
			const startVadResult = await VadService.startVad();
			invalidateVadState();
			return startVadResult;
		},
	}),

	stopVad: () =>
		({
			mutationFn: async () => {
				const stopResult = await VadService.closeVad();
				return stopResult;
			},
			onSuccess: () => {
				console.info('Stopping voice activated capture');
				playSoundIfEnabled('vad-stop');
			},
			onSettled: invalidateVadState,
		}) satisfies CreateResultMutationOptions<void, WhisperingError, void>,
};
