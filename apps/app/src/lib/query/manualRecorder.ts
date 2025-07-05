import * as services from '$lib/services';
import { toast } from '$lib/toast';
import type { WhisperingRecordingState } from '$lib/constants/audio';
import { defineMutation, defineQuery, stopAllRecordingModesExcept } from './_utils';
import { queryClient } from './index';
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
			// Stop any other recording modes before starting manual recording
			await stopAllRecordingModesExcept('manual');
			
			if (settings.value['recording.mode'] !== 'manual') {
				settings.value = { ...settings.value, 'recording.mode': 'manual' };
			}
			return services.manualRecorder.startRecording(recordingSettings, {
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			});
		},
		onSettled: invalidateRecorderState,
	}),

	stopRecording: defineMutation({
		mutationKey: recorderKeys.stopRecording,
		resultMutationFn: ({ toastId }: { toastId: string }) =>
			services.manualRecorder.stopRecording({
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			}),
		onSettled: invalidateRecorderState,
	}),

	cancelRecording: defineMutation({
		mutationKey: recorderKeys.cancelRecording,
		resultMutationFn: ({ toastId }: { toastId: string }) =>
			services.manualRecorder.cancelRecording({
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			}),
		onSettled: invalidateRecorderState,
	}),
};
