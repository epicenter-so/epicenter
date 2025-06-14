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
			const result = await services.vad.startActiveListening({
				// TODO: This always uses the navigator device ID, but the SelectRecordingDevice component changes its displayed value when the user selects a Tauri device. This will mislead users into thinking that the selected Tauri device is used.
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

			invalidateVadState();
			return result;
		},
	}),

	stopActiveListening: defineMutation({
		mutationKey: ['vadRecorder', 'stopActiveListening'] as const,
		resultMutationFn: async () => {
			const result = await services.vad.stopActiveListening();
			invalidateVadState();
			return result;
		},
	}),
};
