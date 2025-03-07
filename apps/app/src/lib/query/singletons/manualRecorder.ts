import { useCreateRecording } from '$lib/query/recordings/mutations';
import { createResultMutation, createResultQuery } from '$lib/services';
import {
	playSoundIfEnabled,
	userConfiguredServices,
} from '$lib/services/index.js';
import type { UpdateStatusMessageFn } from '$lib/services/recorder/RecorderService';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { noop } from '@tanstack/table-core';
import { nanoid } from 'nanoid/non-secure';
import { getContext, setContext } from 'svelte';
import { queryClient } from '..';
import type { Transcriber } from './transcriber';
import type { Transformer } from './transformer';

export type ManualRecorder = ReturnType<typeof createManualRecorder>;

export const initManualRecorderInContext = ({
	transcriber,
	transformer,
}: {
	transcriber: Transcriber;
	transformer: Transformer;
}) => {
	const manualRecorder = createManualRecorder({ transcriber, transformer });
	setContext('manualRecorder', manualRecorder);
	return manualRecorder;
};

export const getManualRecorderFromContext = () => {
	return getContext<ManualRecorder>('manualRecorder');
};

const manualRecorderKeys = {
	all: ['manualRecorder'] as const,
	state: ['manualRecorder', 'state'] as const,
};

function createManualRecorder({
	transcriber,
	transformer,
}: {
	transcriber: Transcriber;
	transformer: Transformer;
}) {
	const invalidateRecorderState = () =>
		queryClient.invalidateQueries({ queryKey: manualRecorderKeys.state });

	const { createRecording } = useCreateRecording();

	const recorderState = createResultQuery(() => ({
		queryKey: manualRecorderKeys.state,
		queryFn: async () => {
			const recorderStateResult =
				await userConfiguredServices.recorder.getRecorderState();
			return recorderStateResult;
		},
		initialData: 'IDLE' as const,
	}));

	const startRecording = createResultMutation(() => ({
		onMutate: async ({ toastId }) => {
			toast.loading({
				id: toastId,
				title: '🎙️ Preparing to record...',
				description: 'Setting up your recording environment...',
			});
			await ensureRecordingSession.mutateAsync(toastId);
		},
		mutationFn: async ({ toastId }: { toastId: string }) => {
			const startRecordingResult =
				await userConfiguredServices.recorder.startRecording(nanoid(), {
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				});
			return startRecordingResult;
		},
		onError: (error, { toastId }) => {
			toast.error({ id: toastId, ...error });
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
		onSettled: invalidateRecorderState,
	}));

	const stopRecording = createResultMutation(() => ({
		onMutate: ({ toastId }) => {
			toast.loading({
				id: toastId,
				title: '⏸️ Stopping recording...',
				description: 'Finalizing your audio capture...',
			});
		},
		mutationFn: async ({ toastId }: { toastId: string }) => {
			const stopResult = await userConfiguredServices.recorder.stopRecording({
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			});
			return stopResult;
		},
		onError: (error, { toastId }) => {
			toast.error({ id: toastId, ...error });
		},
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
								'Your recording was captured but could not be saved to the database. Please check your storage space and permissions.',
							action: {
								type: 'more-details',
								error: error,
							},
						});
					},
					onSuccess: async (createdRecording) => {
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
							closeRecordingSession.mutate(
								{
									sendStatus: (options) =>
										toast.loading({ id: toastId, ...options }),
								},
								{
									onSuccess: async () => {
										toast.success({
											id: toastId,
											title: '✨ Session Closed Successfully',
											description:
												'Your recording session has been neatly wrapped up',
										});
									},
									onError: (error) => {
										toast.warning({
											id: toastId,
											title: '⚠️ Unable to close session after recording',
											description:
												'You might need to restart the application to continue recording',
											action: {
												type: 'more-details',
												error: error,
											},
										});
									},
								},
							);
						}

						const transcribeToastId = nanoid();
						transcriber.transcribeRecording.mutate(
							{ recording: createdRecording, toastId: transcribeToastId },
							{
								onSuccess: () => {
									if (
										settings.value['transformations.selectedTransformationId']
									) {
										const transformToastId = nanoid();
										transformer.transformRecording.mutate({
											recordingId: createdRecording.id,
											transformationId:
												settings.value[
													'transformations.selectedTransformationId'
												],
											toastId: transformToastId,
										});
									}
								},
							},
						);
					},
				},
			);
		},
		onSettled: invalidateRecorderState,
	}));

	const ensureRecordingSession = createResultMutation(() => ({
		mutationFn: async (toastId: string) => {
			const ensureRecordingSessionResult =
				await userConfiguredServices.recorder.ensureRecordingSession(
					{
						deviceId: settings.value['recording.selectedAudioInputDeviceId'],
						bitsPerSecond:
							Number(settings.value['recording.bitrateKbps']) * 1000,
					},
					{
						sendStatus: (options) => toast.loading({ id: toastId, ...options }),
					},
				);
			return ensureRecordingSessionResult;
		},
		onSettled: invalidateRecorderState,
	}));

	const closeRecordingSession = createResultMutation(() => ({
		mutationFn: async ({
			sendStatus,
		}: {
			sendStatus: UpdateStatusMessageFn;
		}) => {
			const closeResult =
				await userConfiguredServices.recorder.closeRecordingSession({
					sendStatus,
				});
			return closeResult;
		},
		onSettled: invalidateRecorderState,
	}));

	const cancelRecorder = createResultMutation(() => ({
		onMutate: ({ toastId }: { toastId: string }) => {
			toast.loading({
				id: toastId,
				title: '⏸️ Canceling recording...',
				description: 'Cleaning up recording session...',
			});
		},
		mutationFn: async ({ toastId }: { toastId: string }) => {
			const cancelResult =
				await userConfiguredServices.recorder.cancelRecording({
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				});
			return cancelResult;
		},
		onError: (error, { toastId }) => {
			toast.error({ id: toastId, ...error });
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
						sendStatus: (options) => toast.loading({ id: toastId, ...options }),
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
								title: '❌ Failed to close session while cancelling recording',
								description:
									'Your recording was cancelled but we encountered an issue while closing your session. You may need to restart the application.',
								action: { type: 'more-details', error: error },
							});
						},
					},
				);
			}
		},
		onSettled: invalidateRecorderState,
	}));

	return {
		get recorderState() {
			return recorderState.data ?? 'IDLE';
		},
		toggleRecording: async () => {
			const toastId = nanoid();
			if (recorderState.data === 'SESSION+RECORDING') {
				stopRecording.mutate({ toastId });
			} else {
				startRecording.mutate({ toastId });
			}
		},
		cancelRecorderWithToast: () => {
			const toastId = nanoid();
			cancelRecorder.mutate({ toastId });
		},
		closeRecordingSessionSilent: () => {
			const toastId = nanoid();
			closeRecordingSession.mutate(
				{ sendStatus: noop },
				{
					onError: (error) => {
						toast.error({ id: toastId, ...error });
					},
				},
			);
		},
		closeRecordingSessionWithToast: () => {
			const toastId = nanoid();
			return closeRecordingSession.mutate(
				{
					sendStatus: (status) => {
						toast.info({ id: toastId, ...status });
					},
				},
				{
					onError: (error) => {
						toast.error({ id: toastId, ...error });
					},
				},
			);
		},
	};
}
