import type { WhisperingRecordingState } from '$lib/constants/audio';
import { WhisperingErr } from '$lib/result';
import * as services from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from 'wellcrafted/result';
import { defineMutation, defineQuery, queryClient } from './_client';
import { notify } from './notify';

const recorderKeys = {
	state: ['cpalRecorder', 'state'] as const,
	startRecording: ['cpalRecorder', 'startRecording'] as const,
	stopRecording: ['cpalRecorder', 'stopRecording'] as const,
	cancelRecording: ['cpalRecorder', 'cancelRecording'] as const,
} as const;

const invalidateRecorderState = () =>
	queryClient.invalidateQueries({ queryKey: recorderKeys.state });

export const cpalRecorder = {
	getRecorderState: defineQuery({
		queryKey: recorderKeys.state,
		resultQueryFn: async () => {
			const { data: recorderState, error: getRecorderStateError } =
				await services.cpalRecorder.getRecorderState();
			if (getRecorderStateError) {
				return WhisperingErr({
					title: '❌ Failed to get recorder state',
					description: getRecorderStateError.message,
					action: { type: 'more-details', error: getRecorderStateError },
				});
			}
			return Ok(recorderState);
		},
		initialData: 'IDLE' as WhisperingRecordingState,
	}),

	startRecording: defineMutation({
		mutationKey: recorderKeys.startRecording,
		resultMutationFn: async ({
			toastId,
			selectedDeviceId,
		}: {
			toastId: string;
			selectedDeviceId: string | null;
		}) => {
			if (settings.value['recording.mode'] !== 'cpal') {
				settings.value = { ...settings.value, 'recording.mode': 'cpal' };
			}
			const { data: deviceAcquisitionOutcome, error: startRecordingError } =
				await services.cpalRecorder.startRecording(
					{ selectedDeviceId },
					{
						sendStatus: (options) =>
							notify.loading.execute({ id: toastId, ...options }),
					},
				);

			if (startRecordingError) {
				return WhisperingErr({
					title: '❌ Failed to start CPAL recording',
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
				await services.cpalRecorder.stopRecording({
					sendStatus: (options) =>
						notify.loading.execute({ id: toastId, ...options }),
				});

			if (stopRecordingError) {
				return WhisperingErr({
					title: '❌ Failed to stop CPAL recording',
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
				await services.cpalRecorder.cancelRecording({
					sendStatus: (options) =>
						notify.loading.execute({ id: toastId, ...options }),
				});

			if (cancelRecordingError) {
				return WhisperingErr({
					title: '❌ Failed to cancel CPAL recording',
					description: cancelRecordingError.message,
					action: { type: 'more-details', error: cancelRecordingError },
				});
			}
			return Ok(cancelResult);
		},
		onSettled: invalidateRecorderState,
	}),
};
