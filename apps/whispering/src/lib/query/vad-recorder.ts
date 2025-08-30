import type { VadState } from '$lib/constants/audio';

import { fromTaggedErr } from '$lib/result';
import * as services from '$lib/services';
import { enumerateDevices } from '$lib/services/device-stream';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from 'wellcrafted/result';

import { defineMutation, defineQuery, queryClient } from './_client';

const vadRecorderKeys = {
	all: ['vadRecorder'] as const,
	devices: ['vadRecorder', 'devices'] as const,
	state: ['vadRecorder', 'state'] as const,
} as const;

const invalidateVadState = () =>
	queryClient.invalidateQueries({ queryKey: vadRecorderKeys.state });

export const vadRecorder = {
	enumerateDevices: defineQuery({
		queryKey: vadRecorderKeys.devices,
		resultQueryFn: async () => {
			const { data, error } = await enumerateDevices();
			if (error) {
				return fromTaggedErr(error, {
					title: '❌ Failed to enumerate devices',
					action: { error, type: 'more-details' },
				});
			}
			return Ok(data);
		},
	}),

	getVadState: defineQuery({
		initialData: 'IDLE' as VadState,
		queryKey: vadRecorderKeys.state,
		resultQueryFn: () => {
			const vadState = services.vad.getVadState();
			return Ok(vadState);
		},
	}),

	startActiveListening: defineMutation({
		mutationKey: ['vadRecorder', 'startActiveListening'] as const,
		resultMutationFn: async ({
			onSpeechEnd,
			onSpeechStart,
		}: {
			onSpeechEnd: (blob: Blob) => void;
			onSpeechStart: () => void;
		}) => {
			const { data: deviceOutcome, error: startListeningError } =
				await services.vad.startActiveListening({
					deviceId: settings.value['recording.vad.selectedDeviceId'],
					onSpeechEnd: (blob) => {
						invalidateVadState();
						onSpeechEnd(blob);
					},
					onSpeechRealStart: () => {
						invalidateVadState();
					},
					onSpeechStart: () => {
						invalidateVadState();
						onSpeechStart();
					},
					onVADMisfire: () => {
						invalidateVadState();
					},
				});

			if (startListeningError) {
				return fromTaggedErr(startListeningError, {
					title: '❌ Failed to start voice activity detection',
					action: { error: startListeningError, type: 'more-details' },
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
					action: { error: stopListeningError, type: 'more-details' },
				});
			}

			invalidateVadState();
			return Ok(data);
		},
	}),
};
