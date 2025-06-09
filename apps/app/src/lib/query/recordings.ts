import type { DbServiceErrorProperties, Recording } from '$lib/services/db';
import { DbRecordingsService } from '$lib/services/index.js';
import type {
	Accessor,
	CreateResultMutationOptions,
	CreateResultQueryOptions,
} from '@tanstack/svelte-query';
import { queryClient } from '.';
import { Err, Ok } from '@epicenterhq/result';

const recordingKeys = {
	all: ['recordings'] as const,
	latest: ['recordings', 'latest'] as const,
	byId: (id: Accessor<string>) => [...recordingKeys.all, id()] as const,
};

export const recordings = {
	getAllRecordings: () =>
		({
			queryKey: recordingKeys.all,
			queryFn: () => DbRecordingsService.getAllRecordings(),
		}) satisfies CreateResultQueryOptions<
			Recording[],
			DbServiceErrorProperties
		>,

	getLatestRecording: () =>
		({
			queryKey: recordingKeys.latest,
			queryFn: () => DbRecordingsService.getLatestRecording(),
			initialData: () =>
				queryClient
					.getQueryData<Recording[]>(recordingKeys.all)
					?.toSorted(
						(a, b) =>
							new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
					)[0],
			initialDataUpdatedAt: () =>
				queryClient.getQueryState(recordingKeys.all)?.dataUpdatedAt,
		}) satisfies CreateResultQueryOptions<
			Recording | null,
			DbServiceErrorProperties
		>,

	getRecordingById: (id: Accessor<string>) => () =>
		({
			queryKey: recordingKeys.byId(id),
			queryFn: () => DbRecordingsService.getRecordingById(id()),
			initialData: () =>
				queryClient
					.getQueryData<Recording[]>(recordingKeys.all)
					?.find((r) => r.id === id()),
			initialDataUpdatedAt: () =>
				queryClient.getQueryState(recordingKeys.all)?.dataUpdatedAt,
		}) satisfies CreateResultQueryOptions<
			Recording | null,
			DbServiceErrorProperties
		>,

	createRecording: {
		mutationKey: ['recordings', 'createRecording'] as const,
		mutationFn: async (recording) => {
			const { data, error } =
				await DbRecordingsService.createRecording(recording);
			if (error) return Err(error);

			queryClient.setQueryData<Recording[]>(recordingKeys.all, (oldData) => {
				if (!oldData) return [recording];
				return [...oldData, recording];
			});
			queryClient.setQueryData<Recording>(
				recordingKeys.byId(() => recording.id),
				recording,
			);
			queryClient.invalidateQueries({
				queryKey: recordingKeys.latest,
			});

			return Ok(data);
		},
	} satisfies CreateResultMutationOptions<
		Recording,
		DbServiceErrorProperties,
		Recording
	>,

	updateRecording: () =>
		({
			mutationFn: async (recording) => {
				const { data, error } =
					await DbRecordingsService.updateRecording(recording);
				if (error) return Err(error);

				queryClient.setQueryData<Recording[]>(recordingKeys.all, (oldData) => {
					if (!oldData) return [recording];
					return oldData.map((item) =>
						item.id === recording.id ? recording : item,
					);
				});
				queryClient.setQueryData<Recording>(
					recordingKeys.byId(() => recording.id),
					recording,
				);
				queryClient.invalidateQueries({
					queryKey: recordingKeys.latest,
				});

				return Ok(data);
			},
		}) satisfies CreateResultMutationOptions<
			Recording,
			DbServiceErrorProperties,
			Recording
		>,

	deleteRecording: () =>
		({
			mutationFn: async (recording) => {
				const { error } = await DbRecordingsService.deleteRecording(recording);
				if (error) return Err(error);

				queryClient.setQueryData<Recording[]>(recordingKeys.all, (oldData) => {
					if (!oldData) return [];
					return oldData.filter((item) => item.id !== recording.id);
				});
				queryClient.removeQueries({
					queryKey: recordingKeys.byId(() => recording.id),
				});
				queryClient.invalidateQueries({
					queryKey: recordingKeys.latest,
				});

				return Ok(undefined);
			},
		}) satisfies CreateResultMutationOptions<
			void,
			DbServiceErrorProperties,
			Recording
		>,

	deleteRecordings: () =>
		({
			mutationFn: async (recordings) => {
				const { error } =
					await DbRecordingsService.deleteRecordings(recordings);
				if (error) return Err(error);

				queryClient.setQueryData<Recording[]>(recordingKeys.all, (oldData) => {
					if (!oldData) return [];
					const deletedIds = new Set(recordings.map((r) => r.id));
					return oldData.filter((item) => !deletedIds.has(item.id));
				});
				for (const recording of recordings) {
					queryClient.removeQueries({
						queryKey: recordingKeys.byId(() => recording.id),
					});
				}
				queryClient.invalidateQueries({
					queryKey: recordingKeys.latest,
				});

				return Ok(undefined);
			},
		}) satisfies CreateResultMutationOptions<
			void,
			DbServiceErrorProperties,
			Recording[]
		>,
};
