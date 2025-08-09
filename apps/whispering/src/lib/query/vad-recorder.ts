import type { VadState } from '$lib/constants/audio';
import { fromTaggedErr } from '$lib/result';
import * as services from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from 'wellcrafted/result';
import { defineMutation, defineQuery, queryClient } from './_client';
import { rpc } from './index';

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

			const { data: deviceOutcome, error: startListeningError } =
				await services.vad.startActiveListening({
					deviceId: settings.value['recording.selectedDeviceId'],
					onSpeechStart: () => {
						invalidateVadState();
						onSpeechStart();
					},
					onSpeechEnd: (blob) => {
						invalidateVadState();
						onSpeechEnd(blob);
					},
				});

			if (startListeningError) {
				return fromTaggedErr(startListeningError, {
					title: '❌ Failed to start voice activity detection',
					action: { type: 'more-details', error: startListeningError },
				});
			}

			invalidateVadState();
			return Ok(deviceOutcome);
		},
	}),

	stopActiveListening: defineMutation({
		mutationKey: ['vadRecorder', 'stopActiveListening'] as const,
		resultMutationFn: async () => {
			const { data, error: stopListeningError } =
				await services.vad.stopActiveListening();

			if (stopListeningError) {
				return fromTaggedErr(stopListeningError, {
					title: '❌ Failed to stop voice activity detection',
					action: { type: 'more-details', error: stopListeningError },
				});
			}

			invalidateVadState();
			return Ok(data);
		},
	}),
};
