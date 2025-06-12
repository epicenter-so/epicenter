import { services } from '$lib/services';
import { toast } from '$lib/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, isOk } from '@epicenterhq/result';
import type { WhisperingRecordingState } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { defineMutation, defineQuery } from '../_utils';
import { queryClient } from '../index';
import { saveRecordingAndTranscribe } from '../../_handleRecordingTranscription';

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

					await saveRecordingAndTranscribe({
						blob,
						toastId,
						completionTitle: '✨ Voice activated capture complete!',
						completionDescription:
							'Voice activated capture complete! Ready for another take',
					});
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
