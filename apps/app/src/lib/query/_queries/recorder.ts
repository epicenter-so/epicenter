import { services } from '$lib/services';
import type {
	RecordingSessionSettings,
	UpdateStatusMessageFn,
} from '$lib/services/recorder/_types';
import { toast } from '$lib/toast';
import type { WhisperingRecordingState } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { defineMutation, defineQuery } from '../_utils';
import { queryClient } from '../index';
import { settings } from '$lib/stores/settings.svelte';

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
	getMediaDevices: defineQuery({
		queryKey: recorderKeys.mediaDevices,
		resultQueryFn: () => services.recorder.enumerateRecordingDevices(),
	}),

	getRecorderState: defineQuery({
		queryKey: recorderKeys.state,
		resultQueryFn: () => services.recorder.getRecorderState(),
		initialData: 'IDLE' as WhisperingRecordingState,
	}),

	closeRecordingSession: defineMutation({
		mutationKey: recorderKeys.closeSession,
		resultMutationFn: ({ sendStatus }: { sendStatus: UpdateStatusMessageFn }) =>
			services.recorder.closeRecordingSession({ sendStatus }),
		onSettled: invalidateRecorderState,
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
			services.recorder.startRecording(
				{ recordingId: nanoid(), settings },
				{ sendStatus: (options) => toast.loading({ id: toastId, ...options }) },
			),
		onSettled: invalidateRecorderState,
	}),

	stopRecording: defineMutation({
		mutationKey: recorderKeys.stopRecording,
		resultMutationFn: ({ toastId }: { toastId: string }) =>
			services.recorder.stopRecording({
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			}),
		onSettled: invalidateRecorderState,
	}),

	cancelRecording: defineMutation({
		mutationKey: recorderKeys.cancelRecording,
		resultMutationFn: ({ toastId }: { toastId: string }) =>
			services.recorder.cancelRecording({
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			}),
		onSettled: invalidateRecorderState,
	}),
};
