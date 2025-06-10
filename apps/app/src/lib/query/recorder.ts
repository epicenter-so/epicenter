import { services } from '$lib/services/index.js';
import type {
	RecordingSessionSettings,
	UpdateStatusMessageFn,
} from '$lib/services/recorder/_types';
import { toast } from '$lib/services/toast';
import { nanoid } from 'nanoid/non-secure';
import { defineMutation, defineQuery, queryClient } from '.';

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
		queryFn: () => services.recorder.enumerateRecordingDevices(),
	}),

	getRecorderState: defineQuery({
		queryKey: recorderKeys.state,
		queryFn: async () => {
			const recorderStateResult = await services.recorder.getRecorderState();
			return recorderStateResult;
		},
		initialData: 'IDLE' as const,
	}),

	closeRecordingSession: defineMutation({
		mutationKey: recorderKeys.closeSession,
		mutationFn: async ({
			sendStatus,
		}: { sendStatus: UpdateStatusMessageFn }) => {
			const result = await services.recorder.closeRecordingSession({
				sendStatus,
			});
			invalidateRecorderState();
			return result;
		},
	}),

	startRecording: defineMutation({
		mutationKey: recorderKeys.startRecording,
		mutationFn: async ({
			toastId,
			settings,
		}: { toastId: string; settings: RecordingSessionSettings }) => {
			const result = await services.recorder.startRecording(
				{ recordingId: nanoid(), settings },
				{
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				},
			);
			invalidateRecorderState();
			return result;
		},
	}),

	stopRecording: defineMutation({
		mutationKey: recorderKeys.stopRecording,
		mutationFn: async ({ toastId }: { toastId: string }) => {
			const result = await services.recorder.stopRecording({
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			});
			invalidateRecorderState();
			return result;
		},
	}),

	cancelRecording: defineMutation({
		mutationKey: recorderKeys.cancelRecording,
		mutationFn: async ({ toastId }: { toastId: string }) => {
			const result = await services.recorder.cancelRecording({
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			});
			invalidateRecorderState();
			return result;
		},
	}),
};
