import { queryClient } from '$lib/query';
import type { Recording } from '$lib/services/db';
import { DbRecordingsService } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { createQuery } from '@tanstack/svelte-query';
import type { Accessor } from '../types';

// Define the query key as a constant array
export const recordingsKeys = {
	all: ['recordings'] as const,
	latest: ['recordings', 'latest'] as const,
	byId: (id: string) => [...recordingsKeys.all, id] as const,
};

export function useRecordingsQuery() {
	return {
		recordingsQuery: createQuery(() => ({
			queryKey: recordingsKeys.all,
			queryFn: async () => {
				const { data: recordings, error: getAllRecordingsError } =
					await DbRecordingsService.getAllRecordings();
				if (getAllRecordingsError) {
					toast.error({
						title: 'Failed to fetch recordings!',
						description: 'Your recordings could not be fetched.',
						action: { type: 'more-details', error: getAllRecordingsError },
					});
					throw getAllRecordingsError;
				}
				return recordings;
			},
		})),
	};
}

export function useLatestRecording() {
	return {
		latestRecordingQuery: createQuery(() => ({
			queryKey: recordingsKeys.latest,
			queryFn: async () => {
				const { data: latestRecording, error: getLatestRecordingError } =
					await DbRecordingsService.getLatestRecording();
				if (getLatestRecordingError) {
					toast.error({
						title: 'Failed to fetch latest recording!',
						description: 'Your latest recording could not be fetched.',
						action: { type: 'more-details', error: getLatestRecordingError },
					});
					throw getLatestRecordingError;
				}
				return latestRecording;
			},
		})),
	};
}

export function useRecordingQuery(id: Accessor<string>) {
	return {
		recordingQuery: createQuery(() => ({
			queryKey: recordingsKeys.byId(id()),
			queryFn: async () => {
				const { data: recording, error: getRecordingByIdError } =
					await DbRecordingsService.getRecordingById(id());
				if (getRecordingByIdError) {
					toast.error({
						title: 'Failed to fetch recording!',
						description: 'Your recording could not be fetched.',
						action: { type: 'more-details', error: getRecordingByIdError },
					});
					throw getRecordingByIdError;
				}
				return recording;
			},
			initialData: () =>
				queryClient
					.getQueryData<Recording[]>(recordingsKeys.all)
					?.find((r) => r.id === id()),
			initialDataUpdatedAt: () =>
				queryClient.getQueryState(recordingsKeys.all)?.dataUpdatedAt,
		})),
	};
}
