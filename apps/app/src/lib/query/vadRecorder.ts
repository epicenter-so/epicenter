import * as services from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from 'wellcrafted/result';
import type { VadState } from '$lib/constants/audio';
import { defineMutation, defineQuery } from './_utils';
import { queryClient, rpc } from './index';

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
			// Switch to VAD mode (handles stopping other recordings)
			await rpc.settings.switchRecordingMode.execute('vad');

			const result = await services.vad.startActiveListening({
				deviceId: settings.value['recording.navigator.selectedDeviceId'],
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
