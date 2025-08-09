import type { WhisperingRecordingState } from '$lib/constants/audio';
import { fromTaggedErr } from '$lib/result';
import * as services from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from 'wellcrafted/result';
import { defineMutation, defineQuery, queryClient } from './_client';
import { notify } from './notify';

const recorderKeys = {
	currentRecordingId: ['recorder', 'currentRecordingId'] as const,
	devices: ['recorder', 'devices'] as const,
	startRecording: ['recorder', 'startRecording'] as const,
	stopRecording: ['recorder', 'stopRecording'] as const,
	cancelRecording: ['recorder', 'cancelRecording'] as const,
} as const;

const invalidateRecorderState = () =>
	queryClient.invalidateQueries({ queryKey: recorderKeys.currentRecordingId });

export const recorder = {
	// Query that enumerates available recording devices
	enumerateDevices: defineQuery({
		queryKey: recorderKeys.devices,
		resultQueryFn: () => services.recorder.enumerateRecordingDeviceIds(),
	}),

	// Query that returns the raw recording ID (null if not recording)
	getCurrentRecordingId: defineQuery({
		queryKey: recorderKeys.currentRecordingId,
		resultQueryFn: async () => {
			const { data: recordingId, error: getRecordingIdError } =
				await services.recorder.getCurrentRecordingId();
			if (getRecordingIdError) {
				return fromTaggedErr(getRecordingIdError, {
					title: '❌ Failed to get current recording',
					action: { type: 'more-details', error: getRecordingIdError },
				});
			}
			return Ok(recordingId);
		},
		initialData: null as string | null,
	}),

	// Query that transforms recording ID to state (RECORDING or IDLE)
	getRecorderState: defineQuery({
		queryKey: recorderKeys.currentRecordingId, // Same key as getCurrentRecordingId!
		resultQueryFn: async () => {
			const { data: recordingId, error: getRecordingIdError } =
				await services.recorder.getCurrentRecordingId();
			if (getRecordingIdError) {
				return fromTaggedErr(getRecordingIdError, {
					title: '❌ Failed to get recorder state',
					action: { type: 'more-details', error: getRecordingIdError },
				});
			}
			return Ok(recordingId);
		},
		select: (data) => {
			// Transform recording ID to state
			const state: WhisperingRecordingState = data ? 'RECORDING' : 'IDLE';
			return state;
		},
		initialData: null as string | null,
	}),

	startRecording: defineMutation({
		mutationKey: recorderKeys.startRecording,
		resultMutationFn: async ({ toastId }: { toastId: string }) => {
			// Generate a unique recording ID
			const recordingId = `recording_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

			// Prepare recording parameters based on platform
			const params = {
				selectedDeviceId: settings.value['recording.selectedDeviceId'],
				recordingId,
				...(window.__TAURI_INTERNALS__
					? {
							platform: 'desktop' as const,
							outputFolder: settings.value['recording.desktop.outputFolder'],
							sampleRate: settings.value['recording.desktop.sampleRate'],
						}
					: {
							platform: 'web' as const,
							bitrateKbps: settings.value['recording.navigator.bitrateKbps'],
						}),
			};

			const { data: deviceAcquisitionOutcome, error: startRecordingError } =
				await services.recorder.startRecording(params, {
					sendStatus: (options) =>
						notify.loading.execute({ id: toastId, ...options }),
				});

			if (startRecordingError) {
				return fromTaggedErr(startRecordingError, {
					title: '❌ Failed to start recording',
					action: { type: 'more-details', error: startRecordingError },
				});
			}
			return Ok(deviceAcquisitionOutcome);
		},
		onSettled: invalidateRecorderState,
	}),

	stopRecording: defineMutation({
		mutationKey: recorderKeys.stopRecording,
		resultMutationFn: async ({ toastId }: { toastId: string }) => {
			const { data: blob, error: stopRecordingError } =
				await services.recorder.stopRecording({
					sendStatus: (options) =>
						notify.loading.execute({ id: toastId, ...options }),
				});

			if (stopRecordingError) {
				return fromTaggedErr(stopRecordingError, {
					title: '❌ Failed to stop recording',
					action: { type: 'more-details', error: stopRecordingError },
				});
			}
			return Ok(blob);
		},
		onSettled: invalidateRecorderState,
	}),

	cancelRecording: defineMutation({
		mutationKey: recorderKeys.cancelRecording,
		resultMutationFn: async ({ toastId }: { toastId: string }) => {
			const { data: cancelResult, error: cancelRecordingError } =
				await services.recorder.cancelRecording({
					sendStatus: (options) =>
						notify.loading.execute({ id: toastId, ...options }),
				});

			if (cancelRecordingError) {
				return fromTaggedErr(cancelRecordingError, {
					title: '❌ Failed to cancel recording',
					action: { type: 'more-details', error: cancelRecordingError },
				});
			}
			return Ok(cancelResult);
		},
		onSettled: invalidateRecorderState,
	}),
};
