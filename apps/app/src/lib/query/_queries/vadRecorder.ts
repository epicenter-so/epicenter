import { services } from '$lib/services';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, isOk } from '@epicenterhq/result';
import type { WhisperingRecordingState } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { defineMutation, defineQuery } from '../_utils';
import { queryClient } from '../index';
import { recordings } from './recordings';
import { maybeCopyAndPaste } from '../../maybeCopyAndPaste';
import { transcription } from './transcription';
import { transformer } from './transformer';

const vadRecorderKeys = {
	all: ['vadRecorder'] as const,
	state: ['vadRecorder', 'state'] as const,
	closeVad: ['vadRecorder', 'closeVad'] as const,
} as const;

const invalidateVadState = () =>
	queryClient.invalidateQueries({ queryKey: vadRecorderKeys.state });

export const vadRecorder = {
	getVadState: defineQuery({
		queryKey: vadRecorderKeys.state,
		resultQueryFn: () => {
			const vadState = services.vad.getVadState();
			return Ok(vadState);
		},
		initialData: 'IDLE' as WhisperingRecordingState,
	}),

	closeVadSession: defineMutation({
		mutationKey: vadRecorderKeys.closeVad,
		resultMutationFn: async () => {
			const closeResult = await services.vad.closeVad();
			invalidateVadState();
			return closeResult;
		},
	}),

	startActiveListening: defineMutation({
		mutationKey: ['vadRecorder', 'startActiveListening'] as const,
		resultMutationFn: async () => {
			const { error: ensureVadError } = await services.vad.ensureVad({
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
					services.sound.playSoundIfEnabled('vad-capture');

					const now = new Date().toISOString();
					const newRecordingId = nanoid();

					const { data: createdRecording, error: createRecordingError } =
						await recordings.createRecording.execute({
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
							action: { type: 'more-details', error: createRecordingError },
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
					const { data: transcribedText, error: transcribeError } =
						await transcription.transcribeRecording.execute(createdRecording);

					if (transcribeError) {
						if (transcribeError.name === 'WhisperingError') {
							toast.error({ id: transcribeToastId, ...transcribeError });
							return;
						}
						toast.error({
							id: transcribeToastId,
							title: '❌ Failed to transcribe recording',
							description: 'Your recording could not be transcribed.',
							action: { type: 'more-details', error: transcribeError },
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

					// Run recording through a transformation if a transformation is selected
					if (settings.value['transformations.selectedTransformationId']) {
						const { data: transformation, error: getTransformationError } =
							await services.db.getTransformationById(
								settings.value['transformations.selectedTransformationId'],
							);

						// Might have matching transformation, but we couldn't get it
						if (getTransformationError) {
							toast.error({
								id: nanoid(),
								title: '❌ Failed to get transformation',
								description:
									'Your transformation could not be retrieved. Please try again.',
								action: { type: 'more-details', error: getTransformationError },
							});
							return;
						}

						// No matching transformation found, so we need to clear the selected transformation
						if (!transformation) {
							settings.value = {
								...settings.value,
								'transformations.selectedTransformationId': null,
							};
							toast.warning({
								id: nanoid(),
								title: '⚠️ No matching transformation found',
								description:
									'No matching transformation found. Please select a different transformation.',
								action: {
									type: 'link',
									label: 'Select a different transformation',
									goto: '/transformations',
								},
							});
							return;
						}

						const transformToastId = nanoid();
						await transformer.transformRecording.execute({
							recordingId: createdRecording.id,
							transformationId:
								settings.value['transformations.selectedTransformationId'],
							toastId: transformToastId,
						});
					}
				},
			});

			if (ensureVadError) return Err(ensureVadError);

			const startVadResult = await services.vad.startVad();
			invalidateVadState();
			return startVadResult;
		},
	}),

	stopVad: defineMutation({
		mutationKey: ['vadRecorder', 'stopVad'] as const,
		resultMutationFn: async () => {
			const stopResult = await services.vad.closeVad();
			if (isOk(stopResult)) {
				console.info('Stopping voice activated capture');
				services.sound.playSoundIfEnabled('vad-stop');
			}
			invalidateVadState();
			return stopResult;
		},
	}),
};
