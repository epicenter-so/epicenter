import { services } from '$lib/services/index.js';
import type {
	RecordingServiceError,
	RecordingSessionSettings,
	UpdateStatusMessageFn,
} from '$lib/services/recorder/_types';
import { toast } from '$lib/services/toast';
import type { Result } from '@epicenterhq/result';
import type { CreateResultQueryOptions } from '@tanstack/svelte-query';
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
	getMediaDevices: {
		queryKey: recorderKeys.mediaDevices,
		queryFn: () => services.recorder.enumerateRecordingDevices(),
	},

	getRecorderState: {
		queryKey: recorderKeys.state,
		queryFn: async () => {
			const recorderStateResult = await services.recorder.getRecorderState();
			return recorderStateResult;
		},
		initialData: 'IDLE' as const,
	},

	closeRecordingSession: async ({
		sendStatus,
	}: { sendStatus: UpdateStatusMessageFn }) => {
		const result = await services.recorder.closeRecordingSession({
			sendStatus,
		});
		invalidateRecorderState();
		return result;
	},

	startRecording: async ({
		toastId,
		settings,
	}: { toastId: string; settings: RecordingSessionSettings }) => {
		invalidateRecorderState();
		const result = await services.recorder.startRecording(
			{ recordingId: nanoid(), settings },
			{ sendStatus: (options) => toast.loading({ id: toastId, ...options }) },
		);
		invalidateRecorderState();
		return result;
	},

	stopRecording: async ({ toastId }: { toastId: string }) => {
		const result = await services.recorder.stopRecording({
			sendStatus: (options) => toast.loading({ id: toastId, ...options }),
		});
		invalidateRecorderState();
		return result;
	},

	cancelRecording: async ({ toastId }: { toastId: string }) => {
		const result = await services.recorder.cancelRecording({
			sendStatus: (options) => toast.loading({ id: toastId, ...options }),
		});
		invalidateRecorderState();
		return result;
	},
} satisfies Record<
	string,
	| CreateResultQueryOptions<any, RecordingServiceError>
	| ((...args: any[]) => Promise<Result<any, RecordingServiceError>>)
>;
