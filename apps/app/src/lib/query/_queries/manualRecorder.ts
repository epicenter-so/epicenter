import { services } from '$lib/services';
import { toast } from '$lib/toast';
import type { WhisperingRecordingState } from '$lib/constants';
import { defineMutation, defineQuery } from '../_utils';
import { queryClient } from '../index';

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
		resultMutationFn: ({
			toastId,
			settings,
		}: {
			toastId: string;
			settings: {
				selectedDeviceId: string | null;
				bitrateKbps: string;
			};
		}) =>
			services.manualRecorder.startRecording(settings, {
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			}),
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
