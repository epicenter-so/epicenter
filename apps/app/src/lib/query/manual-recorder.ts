import type { WhisperingRecordingState } from '$lib/constants/audio';
import { WhisperingErr } from '$lib/result';
import * as services from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from 'wellcrafted/result';
import { defineMutation, defineQuery, queryClient } from './_client';
import { rpc } from './index';
import { notify } from './notify';

const recorderKeys = {
	state: ['recorder', 'state'] as const,
	startRecording: ['recorder', 'startRecording'] as const,
	stopRecording: ['recorder', 'stopRecording'] as const,
	cancelRecording: ['recorder', 'cancelRecording'] as const,
} as const;

const invalidateRecorderState = () =>
	queryClient.invalidateQueries({ queryKey: recorderKeys.state });

export const manualRecorder = {
	getRecorderState: defineQuery({
		queryKey: recorderKeys.state,
		resultQueryFn: () => services.manualRecorder.getRecorderState(),
		initialData: 'IDLE' as WhisperingRecordingState,
	}),

	startRecording: defineMutation({
		mutationKey: recorderKeys.startRecording,
		resultMutationFn: async ({ toastId }: { toastId: string }) => {
			const recordingSettings = {
				selectedDeviceId:
					settings.value['recording.navigator.selectedDeviceId'],
				bitrateKbps: settings.value['recording.navigator.bitrateKbps'] ?? '128',
			};
			// Switch to manual mode (handles stopping other recordings)
			await rpc.settings.switchRecordingMode.execute('manual');

			const { data: deviceAcquisitionOutcome, error: startRecordingError } =
				await services.manualRecorder.startRecording(recordingSettings, {
					sendStatus: (options) =>
						notify.loading.execute({ id: toastId, ...options }),
				});

			if (startRecordingError) {
				return WhisperingErr({
						title: '❌ Failed to start recording',
						description: startRecordingError.message,
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
				await services.manualRecorder.stopRecording({
					sendStatus: (options) =>
						notify.loading.execute({ id: toastId, ...options }),
				});

			if (stopRecordingError) {
				return WhisperingErr({
						title: '❌ Failed to stop recording',
						description: stopRecordingError.message,
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
				await services.manualRecorder.cancelRecording({
					sendStatus: (options) =>
						notify.loading.execute({ id: toastId, ...options }),
				});

			if (cancelRecordingError) {
				return WhisperingErr({
						title: '❌ Failed to cancel recording',
						description: cancelRecordingError.message,
						action: { type: 'more-details', error: cancelRecordingError },
				});
			}
			return Ok(cancelResult);
		},
		onSettled: invalidateRecorderState,
	}),
};
