import { services } from '$lib/services/index.js';
import type {
	RecordingServiceError,
	UpdateStatusMessageFn,
} from '$lib/services/recorder/_types';
import { toast } from '$lib/services/toast';
import type { WhisperingRecordingState } from '@repo/shared';
import type {
	CreateResultMutationOptions,
	CreateResultQueryOptions,
} from '@tanstack/svelte-query';
import { nanoid } from 'nanoid/non-secure';
import { queryClient } from '.';

const recorderKeys = {
	mediaDevices: ['recorder', 'mediaDevices'] as const,
	state: ['recorder', 'state'] as const,
	startRecording: ['recorder', 'startRecording'] as const,
	stopRecording: ['recorder', 'stopRecording'] as const,
	cancelRecording: ['recorder', 'cancelRecording'] as const,
	closeSession: ['recorder', 'closeSession'] as const,
} as const;

const invalidateRecorderState = () =>
	queryClient.invalidateQueries({ queryKey: recorderKeys.state });

export const recorder = {
	getMediaDevices: () => ({
		queryKey: recorderKeys.mediaDevices,
		queryFn: () => services.recorder.enumerateRecordingDevices(),
	}),

	getRecorderState: () =>
		({
			queryKey: recorderKeys.state,
			queryFn: async () => {
				const recorderStateResult = await services.recorder.getRecorderState();
				return recorderStateResult;
			},
			initialData: 'IDLE' as const,
		}) satisfies CreateResultQueryOptions<
			WhisperingRecordingState,
			RecordingServiceError
		>,

	closeRecordingSession: () =>
		({
			mutationFn: ({ sendStatus }) =>
				services.recorder.closeRecordingSession({ sendStatus }),
			onSettled: invalidateRecorderState,
		}) satisfies CreateResultMutationOptions<
			void,
			RecordingServiceError,
			{ sendStatus: UpdateStatusMessageFn }
		>,

	startRecording: () =>
		({
			onMutate: invalidateRecorderState,
			mutationFn: ({ toastId }: { toastId: string }) =>
				services.recorder.startRecording(nanoid(), {
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				}),
			onSettled: invalidateRecorderState,
		}) satisfies CreateResultMutationOptions<
			void,
			RecordingServiceError,
			{ toastId: string }
		>,

	stopRecording: () =>
		({
			mutationFn: ({ toastId }: { toastId: string }) =>
				services.recorder.stopRecording({
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				}),
			onSettled: invalidateRecorderState,
		}) satisfies CreateResultMutationOptions<
			Blob,
			RecordingServiceError,
			{ toastId: string }
		>,

	cancelRecording: () =>
		({
			mutationFn: async ({ toastId }) => {
				const cancelResult = await services.recorder.cancelRecording({
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				});
				return cancelResult;
			},
			onSettled: invalidateRecorderState,
		}) satisfies CreateResultMutationOptions<
			void,
			RecordingServiceError,
			{ toastId: string }
		>,
};
