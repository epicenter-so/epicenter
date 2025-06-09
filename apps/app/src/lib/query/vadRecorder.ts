import { settings } from '$lib/stores/settings.svelte';
import { Ok } from '@epicenterhq/result';
import {
	createResultMutation,
	type CreateResultMutationOptions,
	type CreateResultQueryOptions,
} from '@tanstack/svelte-query';
import { nanoid } from 'nanoid/non-secure';
import { queryClient } from '.';
import { recordings } from './recordings';
import { playSoundIfEnabled, VadService } from '$lib/services';
import { toast } from '$lib/services/toast';
import type { WhisperingError } from '@repo/shared';

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
			const createRecording = createResultMutation(recordings.createRecording);
			const ensureVadResult = await VadService.ensureVad({
				deviceId:
					settings.value['recording.navigator.selectedAudioInputDeviceId'],
				onSpeechEnd: (blob) => {
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

					createRecording.mutate(
						{
							id: newRecordingId,
							title: '',
							subtitle: '',
							createdAt: now,
							updatedAt: now,
							timestamp: now,
							transcribedText: '',
							blob,
							transcriptionStatus: 'UNPROCESSED',
						},
						{
							onError(error) {
								toast.error({
									id: toastId,
									title: '❌ Database Save Failed',
									description:
										'Your voice activated capture was captured but could not be saved to the database. Please check your storage space and permissions.',
									action: {
										type: 'more-details',
										error: error,
									},
								});
							},
							onSuccess: async (createdRecording) => {
								toast.loading({
									id: toastId,
									title: '✨ Voice activated capture complete!',
									description: settings.value[
										'recording.isFasterRerecordEnabled'
									]
										? 'Voice activated capture complete! Ready for another take'
										: 'Voice activated capture complete! Session closed successfully',
								});

								const transcribeToastId = nanoid();
								toast.loading({
									id: transcribeToastId,
									title: '📋 Transcribing...',
									description: 'Your recording is being transcribed...',
								});
								transcribeRecording.mutate(createdRecording, {
									onSuccess: (transcribedText) => {
										toast.success({
											id: transcribeToastId,
											title: 'Transcribed recording!',
											description: 'Your recording has been transcribed.',
										});
										maybeCopyAndPaste({
											text: transcribedText,
											toastId,
											shouldCopy:
												settings.value['transcription.clipboard.copyOnSuccess'],
											shouldPaste:
												settings.value[
													'transcription.clipboard.pasteOnSuccess'
												],
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
										if (
											settings.value['transformations.selectedTransformationId']
										) {
											const transformToastId = nanoid();
											transformRecording.mutate({
												recordingId: createdRecording.id,
												transformationId:
													settings.value[
														'transformations.selectedTransformationId'
													],
												toastId: transformToastId,
											});
										}
									},
									onError: (error) => {
										if (error.name === 'WhisperingError') {
											toast.error({
												id: transcribeToastId,
												...error,
											});
											return;
										}
										toast.error({
											id: transcribeToastId,
											title: '❌ Failed to transcribe recording',
											description: 'Your recording could not be transcribed.',
											action: {
												type: 'more-details',
												error: error,
											},
										});
									},
								});
							},
						},
					);
				},
			});
		},
		mutationFn: async () => {
			const startVadResult = await VadService.startVad();
			return startVadResult;
		},
		onSettled: invalidateVadState,
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
