import type { WhisperingRecordingState } from '$lib/constants/audio';
import { fromTaggedErr } from '$lib/result';
import * as services from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { Ok, resolve } from 'wellcrafted/result';
import { defineMutation, defineQuery, queryClient } from './_client';
import { notify } from './notify';
import { nanoid } from 'nanoid/non-secure';

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
	// Query that enumerates available recording devices with labels
	enumerateDevices: defineQuery({
		queryKey: recorderKeys.devices,
		resultQueryFn: async () => {
			const { data, error } = await recorderService().enumerateDevices();
			if (error) {
				return fromTaggedErr(error, {
					title: '❌ Failed to enumerate devices',
					action: { type: 'more-details', error },
				});
			}
			return Ok(data);
		},
	}),

	// Query that returns the raw recording ID (null if not recording)
	getCurrentRecordingId: defineQuery({
		queryKey: recorderKeys.currentRecordingId,
		resultQueryFn: async () => {
			const { data: recordingId, error: getRecordingIdError } =
				await recorderService().getCurrentRecordingId();
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
				await recorderService().getCurrentRecordingId();
			if (getRecordingIdError) {
				return fromTaggedErr(getRecordingIdError, {
					title: '❌ Failed to get recorder state',
					action: { type: 'more-details', error: getRecordingIdError },
				});
			}
			return Ok(recordingId);
		},
		select: (state): WhisperingRecordingState =>
			resolve(state) ? 'RECORDING' : 'IDLE',
		initialData: null as string | null,
	}),

	startRecording: defineMutation({
		mutationKey: recorderKeys.startRecording,
		resultMutationFn: async ({ toastId }: { toastId: string }) => {
			// Generate a unique recording ID that will serve as the file name
			const recordingId = nanoid();

			const backend = !window.__TAURI_INTERNALS__
				? 'browser'
				: settings.value['recording.backend'];

			// Prepare recording parameters based on which backend we're using
			const baseParams = {
				selectedDeviceId: settings.value['recording.manual.selectedDeviceId'],
				recordingId,
			};

			const params =
				backend === 'browser'
					? {
							...baseParams,
							implementation: 'navigator' as const,
							bitrateKbps: settings.value['recording.navigator.bitrateKbps'],
						}
					: backend === 'ffmpeg'
						? {
								...baseParams,
								implementation: 'ffmpeg' as const,
								commandTemplate:
									settings.value['recording.ffmpeg.commandTemplate'],
							}
						: {
								...baseParams,
								implementation: 'cpal' as const,
								outputFolder: settings.value['recording.desktop.outputFolder'],
								sampleRate: settings.value['recording.desktop.sampleRate'],
							};

			const { data: deviceAcquisitionOutcome, error: startRecordingError } =
				await recorderService().startRecording(params, {
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
				await recorderService().stopRecording({
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
				await recorderService().cancelRecording({
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

/**
 * Get the appropriate recorder service based on settings and environment
 */
export function recorderService() {
	// In browser, always use browser recorder
	if (!window.__TAURI_INTERNALS__) return services.browserRecorder;

	// In desktop, check user preference
	const backend = settings.value['recording.backend'];

	return {
		browser: services.browserRecorder,
		ffmpeg: services.ffmpegRecorder,
		native: services.nativeRecorder,
	}[backend];
}
