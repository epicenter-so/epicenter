import type { DbServiceErrorProperties, Recording } from '$lib/services/db';
import { DbRecordingsService } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { Err, Ok } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import type {
	Accessor,
	CreateResultMutationOptions,
	CreateResultQueryOptions,
} from '@tanstack/svelte-query';
import { queryClient } from '.';

const recordingKeys = {
	all: ['recordings'] as const,
	latest: ['recordings', 'latest'] as const,
	byId: (id: Accessor<string>) => [...recordingKeys.all, id()] as const,
};

export const recordings = {
	getAllRecordings: () => () =>
		({
			queryKey: recordingKeys.all,
			queryFn: () => DbRecordingsService.getAllRecordings(),
		}) satisfies CreateResultQueryOptions<
			Recording[],
			DbServiceErrorProperties
		>,

	getLatestRecording: () => () =>
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

	createRecording: () => () =>
		({
			mutationFn: async (recording) => {
				const { error: createRecordingError } =
					await DbRecordingsService.createRecording(recording);
				if (createRecordingError) {
					return Err({
						name: 'WhisperingError',
						title: 'Failed to create recording!',
						description: 'Your recording could not be created.',
						action: { type: 'more-details', error: createRecordingError },
						context: { recording },
						cause: createRecordingError,
					} satisfies WhisperingError);
				}

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

				return Ok(recording);
			},
		}) satisfies CreateResultMutationOptions<
			Recording,
			WhisperingError,
			Recording
		>,

	updateRecording: () => () =>
		({
			mutationFn: async (recording) => {
				const { error: updateRecordingError } =
					await DbRecordingsService.updateRecording(recording);
				if (updateRecordingError) {
					return Err(updateRecordingError);
				}

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

				return Ok(recording);
			},
		}) satisfies CreateResultMutationOptions<
			Recording,
			DbServiceErrorProperties,
			Recording
		>,

	updateRecordingWithToast: () => () =>
		({
			mutationFn: async (recording) => {
				const { error: updateRecordingError } =
					await DbRecordingsService.updateRecording(recording);
				if (updateRecordingError) {
					const whisperingError = {
						name: 'WhisperingError',
						title: 'Failed to update recording!',
						description: 'Your recording could not be updated.',
						action: { type: 'more-details', error: updateRecordingError },
						context: { recording },
						cause: updateRecordingError,
					} satisfies WhisperingError;
					toast.error(whisperingError);
					return Err(whisperingError);
				}

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

				toast.success({
					title: 'Updated recording!',
					description: 'Your recording has been updated successfully.',
				});

				return Ok(recording);
			},
		}) satisfies CreateResultMutationOptions<
			Recording,
			WhisperingError,
			Recording
		>,

	deleteRecordingWithToast: () => () =>
		({
			mutationFn: async (recording) => {
				const { error: deleteRecordingError } =
					await DbRecordingsService.deleteRecording(recording);
				if (deleteRecordingError) {
					const whisperingError = {
						name: 'WhisperingError',
						title: 'Failed to delete recording!',
						description: 'Your recording could not be deleted.',
						action: { type: 'more-details', error: deleteRecordingError },
						context: { recording },
						cause: deleteRecordingError,
					} satisfies WhisperingError;
					toast.error(whisperingError);
					return Err(whisperingError);
				}
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

				toast.success({
					title: 'Deleted recording!',
					description: 'Your recording has been deleted successfully.',
				});

				return Ok(recording);
			},
		}) satisfies CreateResultMutationOptions<
			Recording,
			WhisperingError,
			Recording
		>,

	deleteRecordingsWithToast: () => () =>
		({
			mutationFn: async (recordings) => {
				const { error: deleteRecordingsError } =
					await DbRecordingsService.deleteRecordings(recordings);
				if (deleteRecordingsError) {
					const whisperingError = {
						name: 'WhisperingError',
						title: 'Failed to delete recordings!',
						description: 'Your recordings could not be deleted.',
						action: { type: 'more-details', error: deleteRecordingsError },
						context: { recordings },
						cause: deleteRecordingsError,
					} satisfies WhisperingError;
					toast.error(whisperingError);
					return Err(whisperingError);
				}

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

				toast.success({
					title: 'Deleted recordings!',
					description: 'Your recordings have been deleted successfully.',
				});

				return Ok(recordings);
			},
		}) satisfies CreateResultMutationOptions<
			Recording[],
			WhisperingError,
			Recording[]
		>,
};
