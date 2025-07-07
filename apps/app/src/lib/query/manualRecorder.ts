import * as services from '$lib/services';
import { notify } from './notify';
import type { WhisperingRecordingState } from '$lib/constants/audio';
import { defineMutation, defineQuery } from './_utils';
import { queryClient, rpc } from './index';
import { settings } from '$lib/stores/settings.svelte';

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
				selectedDeviceId: settings.value['recording.navigator.selectedDeviceId'],
				bitrateKbps: settings.value['recording.navigator.bitrateKbps'] ?? '128',
			};
			// Switch to manual mode (handles stopping other recordings)
			await rpc.settings.switchRecordingMode.execute('manual');
			
			return services.manualRecorder.startRecording(recordingSettings, {
				sendStatus: (options) => notify.loading.execute({ id: toastId, ...options }),
			});
		},
		onSettled: invalidateRecorderState,
	}),

	stopRecording: defineMutation({
		mutationKey: recorderKeys.stopRecording,
		resultMutationFn: ({ toastId }: { toastId: string }) =>
			services.manualRecorder.stopRecording({
				sendStatus: (options) => notify.loading.execute({ id: toastId, ...options }),
			}),
		onSettled: invalidateRecorderState,
	}),

	cancelRecording: defineMutation({
		mutationKey: recorderKeys.cancelRecording,
		resultMutationFn: ({ toastId }: { toastId: string }) =>
			services.manualRecorder.cancelRecording({
				sendStatus: (options) => notify.loading.execute({ id: toastId, ...options }),
			}),
		onSettled: invalidateRecorderState,
	}),
};
