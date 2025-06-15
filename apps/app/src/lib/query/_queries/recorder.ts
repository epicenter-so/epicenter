import { services } from '$lib/services';
import type { RecordingSessionSettings } from '$lib/services/recorder/_types';
import { toast } from '$lib/toast';
import type { WhisperingRecordingState } from '@repo/shared';
import { defineMutation, defineQuery } from '../_utils';
import { queryClient } from '../index';

const recorderKeys = {
	mediaDevices: ['recorder', 'mediaDevices'] as const,
	state: ['recorder', 'state'] as const,
	startRecording: ['recorder', 'startRecording'] as const,
	stopRecording: ['recorder', 'stopRecording'] as const,
	cancelRecording: ['recorder', 'cancelRecording'] as const,
} as const;

const invalidateRecorderState = () =>
	queryClient.invalidateQueries({ queryKey: recorderKeys.state });

export const manualRecorder = {
	getMediaDevices: defineQuery({
		queryKey: recorderKeys.mediaDevices,
		resultQueryFn: () => services.manualRecorder.enumerateRecordingDevices(),
	}),

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
			settings: RecordingSessionSettings;
		}) =>
			services.manualRecorder.startRecording(
				{ settings },
				{ sendStatus: (options) => toast.loading({ id: toastId, ...options }) },
			),
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
