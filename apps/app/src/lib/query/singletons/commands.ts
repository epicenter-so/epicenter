import {
	DbRecordingsService,
	playSoundIfEnabled,
	services,
} from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import type { Command } from '@repo/shared';
import {
	createResultMutation,
	createResultQuery,
} from '@tanstack/svelte-query';
import { nanoid } from 'nanoid/non-secure';
import { getContext, setContext } from 'svelte';
import { recorder } from '../recorder';
import { transcription } from '../transcription';
import { vadRecorder } from '../vadRecorder';
import { maybeCopyAndPaste } from './maybeCopyAndPaste';

export type CommandCallbacks = ReturnType<typeof createCommandCallbacks>;

export const initCommandsInContext = () => {
	const commandCallbacks = createCommandCallbacks();
	setContext('commandCallbacks', commandCallbacks);
	return commandCallbacks;
};

export const getCommandsFromContext = () => {
	return getContext<CommandCallbacks>('commandCallbacks');
};

function createCommandCallbacks() {
	const recorderState = createResultQuery(recorder.getRecorderState);
	const getVadState = createResultQuery(vadRecorder.getVadState);
	const startRecording = createResultMutation(recorder.startRecording);
	const stopRecording = createResultMutation(recorder.stopRecording);
	const closeRecordingSession = createResultMutation(
		recorder.closeRecordingSession,
	);
	const cancelRecorder = createResultMutation(recorder.cancelRecording);
	const startActiveListening = createResultMutation(
		vadRecorder.startActiveListening,
	);
	const stopVad = createResultMutation(vadRecorder.stopVad);
	const transcribeRecording = createResultMutation(
		transcription.transcribeRecording,
	);

	return {
		toggleManualRecording: async () => {
			const toastId = nanoid();

			if (recorderState.data === 'SESSION+RECORDING') {
				toast.loading({
					id: toastId,
					title: '⏸️ Stopping recording...',
					description: 'Finalizing your audio capture...',
				});
				stopRecording.mutate(
					{ toastId },
					{
						onError: (error, { toastId }) =>
							toast.error({
								id: toastId,
								title: '❌ Failed to stop recording',
								description:
									'Your recording could not be stopped. Please try again.',
								action: { type: 'more-details', error: error },
							}),
						onSuccess: async (blob, { toastId }) => {
							toast.success({
								id: toastId,
								title: '🎙️ Recording stopped',
								description: 'Your recording has been saved',
							});
							console.info('Recording stopped');
							void playSoundIfEnabled('manual-stop');

							const now = new Date().toISOString();
							const newRecordingId = nanoid();

							const { data: createdRecording, error: createRecordingError } =
								await DbRecordingsService.createRecording({
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
									title: '❌ Failed to save recording',
									description:
										'Your recording was captured but could not be saved to the database. Please check your storage space and permissions.',
									action: { type: 'more-details', error: createRecordingError },
								});
								return;
							}

							toast.loading({
								id: toastId,
								title: '✨ Recording Complete!',
								description: settings.value['recording.isFasterRerecordEnabled']
									? 'Recording saved! Ready for another take'
									: 'Recording saved and session closed successfully',
							});

							if (!settings.value['recording.isFasterRerecordEnabled']) {
								toast.loading({
									id: toastId,
									title: '⏳ Closing recording session...',
									description: 'Wrapping things up, just a moment...',
								});

								const { error: closeRecordingSessionError } =
									await services.recorder.closeRecordingSession({
										sendStatus: (options) =>
											toast.loading({ id: toastId, ...options }),
									});

								if (closeRecordingSessionError) {
									toast.warning({
										id: toastId,
										title: '⚠️ Unable to close session after recording',
										description:
											'You might need to restart the application to continue recording',
										action: {
											type: 'more-details',
											error: closeRecordingSessionError,
										},
									});
								} else {
									toast.success({
										id: toastId,
										title: '✨ Session Closed Successfully',
										description:
											'Your recording session has been neatly wrapped up',
									});
								}
							}

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
										toast.error({ id: transcribeToastId, ...error });
										return;
									}
									toast.error({
										id: transcribeToastId,
										title: '❌ Failed to transcribe recording',
										description: 'Your recording could not be transcribed.',
										action: { type: 'more-details', error: error },
									});
								},
							});
						},
					},
				);
			} else {
				toast.loading({
					id: toastId,
					title: '🎙️ Preparing to record...',
					description: 'Setting up your recording environment...',
				});
				await services.recorder.ensureRecordingSession(settings.value, {
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				});
				startRecording.mutate(
					{ toastId },
					{
						onError: (error, { toastId }) => {
							toast.error({
								id: toastId,
								title: '❌ Failed to start recording',
								description:
									'Your recording could not be started. Please try again.',
								action: { type: 'more-details', error: error },
							});
						},
						onSuccess: (_data, { toastId }) => {
							toast.success({
								id: toastId,
								title: '🎙️ Whispering is recording...',
								description: 'Speak now and stop recording when done',
							});
							console.info('Recording started');
							void playSoundIfEnabled('manual-start');
						},
					},
				);
			}
		},
		cancelManualRecording: () => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '⏸️ Canceling recording...',
				description: 'Cleaning up recording session...',
			});
			cancelRecorder.mutate(
				{ toastId },
				{
					onError: (error, { toastId }) => {
						toast.error({
							id: toastId,
							title: '❌ Failed to cancel recording',
							description:
								'Your recording could not be cancelled. Please try again.',
							action: { type: 'more-details', error: error },
						});
					},
					onSuccess: async (_data, { toastId }) => {
						if (settings.value['recording.isFasterRerecordEnabled']) {
							toast.success({
								id: toastId,
								title: '🚫 Recording Cancelled',
								description:
									'Recording discarded, but session remains open for a new take',
							});
						} else {
							closeRecordingSession.mutate(
								{
									sendStatus: (options) =>
										toast.loading({ id: toastId, ...options }),
								},
								{
									onSuccess: () => {
										toast.success({
											id: toastId,
											title: '✅ All Done!',
											description:
												'Recording cancelled and session closed successfully',
										});
										void playSoundIfEnabled('manual-cancel');
										console.info('Recording cancelled');
									},
									onError: (error) => {
										toast.error({
											id: toastId,
											title:
												'❌ Failed to close session while cancelling recording',
											description:
												'Your recording was cancelled but we encountered an issue while closing your session. You may need to restart the application.',
											action: { type: 'more-details', error: error },
										});
									},
								},
							);
						}
					},
				},
			);
		},
		closeManualRecordingSession: () => {
			const toastId = nanoid();
			return closeRecordingSession.mutate(
				{
					sendStatus: (status) => {
						toast.info({ id: toastId, ...status });
					},
				},
				{
					onError: (error) => {
						toast.error({
							id: toastId,
							title: '❌ Failed to close session',
							description:
								'Your session could not be closed. Please try again.',
							action: { type: 'more-details', error: error },
						});
					},
				},
			);
		},
		toggleVadRecording: () => {
			if (getVadState.data === 'SESSION+RECORDING') {
				const toastId = nanoid();
				toast.loading({
					id: toastId,
					title: '⏸️ Stopping voice activated capture...',
					description: 'Finalizing your voice activated capture...',
				});
				stopVad.mutate(undefined, {
					onError: (error) => {
						toast.error({ id: toastId, ...error });
					},
				});
			} else {
				startActiveListening.mutate();
			}
		},
		// TODO: Implement push to talk
		pushToTalk: () => {},
	} satisfies Record<Command['id'], () => void>;
}
