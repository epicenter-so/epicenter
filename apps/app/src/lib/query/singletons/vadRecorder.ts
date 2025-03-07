import { useCreateRecording } from '$lib/query/recordings/mutations';
import { createResultMutation, createResultQuery } from '$lib/services';
import { playSoundIfEnabled } from '$lib/services/index.js';
import { createVadServiceWeb } from '$lib/services/recorder/VadService.web';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from '@epicenterhq/result';
import { nanoid } from 'nanoid/non-secure';
import { getContext, setContext } from 'svelte';
import { queryClient } from '..';
import type { Transcriber } from './transcriber';
import type { Transformer } from './transformer';

export type VadRecorder = ReturnType<typeof createVadRecorder>;

export const initVadRecorderInContext = ({
	transcriber,
	transformer,
}: {
	transcriber: Transcriber;
	transformer: Transformer;
}) => {
	const vad = createVadRecorder({ transcriber, transformer });
	setContext('vad', vad);
	return vad;
};

export const getVadRecorderFromContext = () => {
	return getContext<VadRecorder>('vad');
};

const vadRecorderKeys = {
	all: ['vadRecorder'] as const,
	state: ['vadRecorder', 'state'] as const,
};

function createVadRecorder({
	transcriber,
	transformer,
}: {
	transcriber: Transcriber;
	transformer: Transformer;
}) {
	const VadService = createVadServiceWeb();
	const invalidateVadState = () =>
		queryClient.invalidateQueries({ queryKey: vadRecorderKeys.state });
	const { createRecording } = useCreateRecording();

	const vadState = createResultQuery(() => ({
		queryKey: vadRecorderKeys.state,
		queryFn: () => {
			const vadState = VadService.getVadState();
			return Ok(vadState);
		},
	}));

	const ensureVadSession = createResultMutation(() => ({
		mutationFn: async () => {
			const ensureVadResult = await VadService.ensureVad({
				deviceId: settings.value['recording.selectedAudioInputDeviceId'],
				onSpeechEnd: (blob) => {
					const toastId = nanoid();
					toast.success({
						id: toastId,
						title: '🎙️ Voice activated speech captured',
						description: 'Your voice activated speech has been captured.',
					});
					console.info('Voice activated speech captured');
					void playSoundIfEnabled('vad-capture');

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
								transcriber.transcribeRecording.mutate(
									{
										recording: createdRecording,
										toastId: transcribeToastId,
									},
									{
										onSuccess: () => {
											if (
												settings.value[
													'transformations.selectedTransformationId'
												]
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
			});
			return ensureVadResult;
		},
		onSettled: invalidateVadState,
	}));

	const closeVadSession = createResultMutation(() => ({
		mutationFn: async () => {
			const closeResult = await VadService.closeVad();
			return closeResult;
		},
		onSettled: invalidateVadState,
	}));

	const startActiveListening = createResultMutation(() => ({
		onMutate: async () => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '🎙️ Preparing to start voice activated capture...',
				description: 'Setting up your voice activated capture environment...',
			});
			await ensureVadSession.mutateAsync();
			return { toastId };
		},
		mutationFn: async () => {
			const startVadResult = await VadService.startVad();
			return startVadResult;
		},
		onError: (error, _variables, ctx) => {
			if (!ctx) return;
			const { toastId } = ctx;
			toast.error({ id: toastId, ...error });
		},
		onSuccess: (_data, _variables, ctx) => {
			if (!ctx) return;
			const { toastId } = ctx;
			toast.success({
				id: toastId,
				title: '🎙️ Voice activated capture session started...',
				description:
					'Speak now. Will transcribe until you end the voice activated capture session',
			});
			console.info('Voice activated capture started');
			void playSoundIfEnabled('vad-start');
		},
		onSettled: invalidateVadState,
	}));

	const stopVad = createResultMutation(() => ({
		onMutate: () => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '⏸️ Stopping voice activated capture...',
				description: 'Finalizing your voice activated capture...',
			});
			return { toastId };
		},
		mutationFn: async () => {
			const stopResult = await VadService.closeVad();
			return stopResult;
		},
		onError: (error, _variables, ctx) => {
			if (!ctx) return;
			const { toastId } = ctx;
			toast.error({ id: toastId, ...error });
		},
		onSuccess: async (_, _variables, ctx) => {
			if (!ctx) return;
			const { toastId } = ctx;

			console.info('Stopping voice activated capture');
			void playSoundIfEnabled('vad-stop');

			if (!settings.value['recording.isFasterRerecordEnabled']) {
				toast.loading({
					id: toastId,
					title: '⏳ Closing voice activated capture session...',
					description: 'Wrapping things up, just a moment...',
				});
				closeVadSession.mutate(undefined, {
					onSuccess: async () => {
						toast.success({
							id: toastId,
							title: '✨ Session Closed Successfully',
							description:
								'Your voice activated capture session has been neatly wrapped up',
						});
					},
					onError: (error) => {
						toast.warning({
							id: toastId,
							title: '⚠️ Unable to close voice activated capture session',
							description:
								'You might need to restart the application to continue voice activated capture',
							action: {
								type: 'more-details',
								error: error,
							},
						});
					},
				});
			}
		},
		onSettled: invalidateVadState,
	}));

	return {
		get vadState() {
			return vadState.data ?? 'IDLE';
		},
		toggleVad: async () => {
			if (vadState.data === 'SESSION+RECORDING') {
				stopVad.mutate();
			} else {
				startActiveListening.mutate();
			}
		},
	};
}
