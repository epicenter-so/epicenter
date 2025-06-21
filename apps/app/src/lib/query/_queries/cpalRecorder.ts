import { services } from '$lib/services';
import { toast } from '$lib/toast';
import type { WhisperingRecordingState } from '$lib/constants';
import { defineMutation, defineQuery } from '../_utils';
import { queryClient } from '../index';

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
		resultQueryFn: () => services.cpalRecorder.getRecorderState(),
		initialData: 'IDLE' as WhisperingRecordingState,
	}),

	startRecording: defineMutation({
		mutationKey: recorderKeys.startRecording,
		resultMutationFn: ({
			toastId,
			selectedDeviceId,
		}: {
			toastId: string;
			selectedDeviceId: string | null;
		}) =>
			services.cpalRecorder.startRecording(
				{ selectedDeviceId },
				{ sendStatus: (options) => toast.loading({ id: toastId, ...options }) },
			),
		onSettled: invalidateRecorderState,
	}),

	stopRecording: defineMutation({
		mutationKey: recorderKeys.stopRecording,
		resultMutationFn: ({ toastId }: { toastId: string }) =>
			services.cpalRecorder.stopRecording({
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			}),
		onSettled: invalidateRecorderState,
	}),

	cancelRecording: defineMutation({
		mutationKey: recorderKeys.cancelRecording,
		resultMutationFn: ({ toastId }: { toastId: string }) =>
			services.cpalRecorder.cancelRecording({
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			}),
		onSettled: invalidateRecorderState,
	}),
};
