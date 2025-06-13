import { services } from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, isOk } from '@epicenterhq/result';
import type { VadState } from '@repo/shared';
import { defineMutation, defineQuery } from '../_utils';
import { queryClient } from '../index';

const vadRecorderKeys = {
	all: ['vadRecorder'] as const,
	state: ['vadRecorder', 'state'] as const,
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
		initialData: 'IDLE' as VadState,
	}),

	startActiveListening: defineMutation({
		mutationKey: ['vadRecorder', 'startActiveListening'] as const,
		resultMutationFn: async ({
			onSpeechStart,
			onSpeechEnd,
		}: {
			onSpeechStart: () => void;
			onSpeechEnd: (blob: Blob) => void;
		}) => {
			const { error: initializeVadError } = await services.vad.initializeVad({
				deviceId:
					settings.value['recording.navigator.selectedAudioInputDeviceId'],
				onSpeechStart: () => {
					invalidateVadState();
					onSpeechStart();
				},
				onSpeechEnd: (blob) => {
					invalidateVadState();
					onSpeechEnd(blob);
				},
			});

			if (initializeVadError) return Err(initializeVadError);

			const startListeningResult = await services.vad.startListening();
			invalidateVadState();
			return startListeningResult;
		},
	}),

	stopVad: defineMutation({
		mutationKey: ['vadRecorder', 'stopVad'] as const,
		resultMutationFn: async () => {
			const destroyResult = await services.vad.destroyVad();
			invalidateVadState();
			return destroyResult;
		},
	}),
};
