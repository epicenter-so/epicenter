import type { WhisperingRecordingState } from '$lib/constants/audio';

import { fromTaggedErr } from '$lib/result';
import * as services from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { nanoid } from 'nanoid/non-secure';
import { Ok, resolve } from 'wellcrafted/result';

import { defineMutation, defineQuery, queryClient } from './_client';
import { notify } from './notify';

const recorderKeys = {
	cancelRecording: ['recorder', 'cancelRecording'] as const,
	currentRecordingId: ['recorder', 'currentRecordingId'] as const,
	devices: ['recorder', 'devices'] as const,
	startRecording: ['recorder', 'startRecording'] as const,
	stopRecording: ['recorder', 'stopRecording'] as const,
} as const;

const invalidateRecorderState = () =>
	queryClient.invalidateQueries({ queryKey: recorderKeys.currentRecordingId });

export const recorder = {
	cancelRecording: defineMutation({
		mutationKey: recorderKeys.cancelRecording,
		onSettled: invalidateRecorderState,
		resultMutationFn: async ({ toastId }: { toastId: string }) => {
			const { data: cancelResult, error: cancelRecordingError } =
				await recorderService().cancelRecording({
					sendStatus: (options) =>
						notify.loading.execute({ id: toastId, ...options }),
				});

			if (cancelRecordingError) {
				return fromTaggedErr(cancelRecordingError, {
					title: '❌ Failed to cancel recording',
					action: { error: cancelRecordingError, type: 'more-details' },
				});
			}

			return Ok(cancelResult);
		},
	}),

	// Query that enumerates available recording devices with labels
	enumerateDevices: defineQuery({
		queryKey: recorderKeys.devices,
		resultQueryFn: async () => {
			const { data, error } = await recorderService().enumerateDevices();
			if (error) {
				return fromTaggedErr(error, {
					title: '❌ Failed to enumerate devices',
					action: { error, type: 'more-details' },
				});
			}
			return Ok(data);
		},
	}),

	// Query that returns the raw recording ID (null if not recording)
	getCurrentRecordingId: defineQuery({
		initialData: null as null | string,
		queryKey: recorderKeys.currentRecordingId,
		resultQueryFn: async () => {
			const { data: recordingId, error: getRecordingIdError } =
				await recorderService().getCurrentRecordingId();
			if (getRecordingIdError) {
				return fromTaggedErr(getRecordingIdError, {
					title: '❌ Failed to get current recording',
					action: { error: getRecordingIdError, type: 'more-details' },
				});
			}
			return Ok(recordingId);
		},
	}),

	// Query that transforms recording ID to state (RECORDING or IDLE)
	getRecorderState: defineQuery({
		initialData: null as null | string,
		queryKey: recorderKeys.currentRecordingId, // Same key as getCurrentRecordingId!
		resultQueryFn: async () => {
			const { data: recordingId, error: getRecordingIdError } =
				await recorderService().getCurrentRecordingId();
			if (getRecordingIdError) {
				return fromTaggedErr(getRecordingIdError, {
					title: '❌ Failed to get recorder state',
					action: { error: getRecordingIdError, type: 'more-details' },
				});
			}
			return Ok(recordingId);
		},
		select: (state): WhisperingRecordingState =>
			resolve(state) ? 'RECORDING' : 'IDLE',
	}),

	startRecording: defineMutation({
		mutationKey: recorderKeys.startRecording,
		onSettled: invalidateRecorderState,
		resultMutationFn: async ({ toastId }: { toastId: string }) => {
			// Generate a unique recording ID that will serve as the file name
			const recordingId = nanoid();

			const isUsingBrowserBackend =
				settings.value['recording.backend'] === 'browser' ||
				!window.__TAURI_INTERNALS__;

			// Prepare recording parameters based on which backend we're using
			const params = {
				recordingId,
				selectedDeviceId: settings.value['recording.manual.selectedDeviceId'],
				...(isUsingBrowserBackend
					? {
							bitrateKbps: settings.value['recording.navigator.bitrateKbps'],
							platform: 'web' as const,
						}
					: {
							outputFolder: settings.value['recording.desktop.outputFolder'],
							platform: 'desktop' as const,
							sampleRate: settings.value['recording.desktop.sampleRate'],
						}),
			};

			const { data: deviceAcquisitionOutcome, error: startRecordingError } =
				await recorderService().startRecording(params, {
					sendStatus: (options) =>
						notify.loading.execute({ id: toastId, ...options }),
				});

			if (startRecordingError) {
				return fromTaggedErr(startRecordingError, {
					title: '❌ Failed to start recording',
					action: { error: startRecordingError, type: 'more-details' },
				});
			}
			return Ok(deviceAcquisitionOutcome);
		},
	}),

	stopRecording: defineMutation({
		mutationKey: recorderKeys.stopRecording,
		onSettled: invalidateRecorderState,
		resultMutationFn: async ({ toastId }: { toastId: string }) => {
			const { data: blob, error: stopRecordingError } =
				await recorderService().stopRecording({
					sendStatus: (options) =>
						notify.loading.execute({ id: toastId, ...options }),
				});

			if (stopRecordingError) {
				return fromTaggedErr(stopRecordingError, {
					title: '❌ Failed to stop recording',
					action: { error: stopRecordingError, type: 'more-details' },
				});
			}

			return Ok(blob);
		},
	}),
};

/**
 * Get the appropriate recorder service based on settings and environment
 */
export function recorderService() {
	// In browser, always use browser recorder
	if (!window.__TAURI_INTERNALS__) return services.browserRecorder;

	// In desktop, check user preference
	return settings.value['recording.backend'] === 'browser'
		? services.browserRecorder
		: services.nativeRecorder;
}
