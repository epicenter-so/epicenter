import * as services from '$lib/services';
import { DbServiceErr, type Recording } from '$lib/services/db';
import type { Accessor } from '@tanstack/svelte-query';
import { nanoid } from 'nanoid';
import { Err, Ok } from 'wellcrafted/result';
import { defineMutation, defineQuery, queryClient } from './_client';
import { transcription } from './transcription';

const recordingKeys = {
	all: ['recordings'] as const,
	latest: ['recordings', 'latest'] as const,
	byId: (id: Accessor<string>) => [...recordingKeys.all, id()] as const,
};

export const recordings = {
	getAllRecordings: defineQuery({
		queryKey: recordingKeys.all,
		resultQueryFn: () => services.db.getAllRecordings(),
	}),

	getLatestRecording: defineQuery({
		queryKey: recordingKeys.latest,
		resultQueryFn: () => services.db.getLatestRecording(),
		initialData: () =>
			queryClient
				.getQueryData<Recording[]>(recordingKeys.all)
				?.toSorted(
					(a, b) =>
						new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
				)[0] ?? null,
		initialDataUpdatedAt: () =>
			queryClient.getQueryState(recordingKeys.all)?.dataUpdatedAt,
	}),

	getRecordingById: (id: Accessor<string>) =>
		defineQuery({
			queryKey: recordingKeys.byId(id),
			resultQueryFn: () => services.db.getRecordingById(id()),
			initialData: () =>
				queryClient
					.getQueryData<Recording[]>(recordingKeys.all)
					?.find((r) => r.id === id()) ?? null,
			initialDataUpdatedAt: () =>
				queryClient.getQueryState(recordingKeys.all)?.dataUpdatedAt,
		}),

	createRecording: defineMutation({
		mutationKey: ['recordings', 'createRecording'] as const,
		resultMutationFn: async (recording: Recording) => {
			const { data, error } = await services.db.createRecording(recording);
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
	}),

	updateRecording: defineMutation({
		mutationKey: ['recordings', 'updateRecording'] as const,
		resultMutationFn: async (recording: Recording) => {
			const { data, error } = await services.db.updateRecording(recording);
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
	}),

	deleteRecording: defineMutation({
		mutationKey: ['recordings', 'deleteRecording'] as const,
		resultMutationFn: async (recording: Recording) => {
			const { error } = await services.db.deleteRecording(recording);
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
	}),

	deleteRecordings: defineMutation({
		mutationKey: ['recordings', 'deleteRecordings'] as const,
		resultMutationFn: async (recordings: Recording[]) => {
			const { error } = await services.db.deleteRecordings(recordings);
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
	}),

	uploadRecording: defineMutation({
		mutationKey: ['recordings', 'uploadRecording'] as const,
		resultMutationFn: async ({ file }: { file: File }) => {
			// Validate file type
			if (!file.type.startsWith('audio/')) {
				return DbServiceErr({
					message: 'Invalid file type. Please upload an audio file.',
					context: { fileType: file.type },
					cause: undefined,
				});
			}

			// Create recording from uploaded file
			const arrayBuffer = await file.arrayBuffer();
			const audioBlob = new Blob([arrayBuffer], { type: file.type });

			const now = new Date().toISOString();
			const newRecording: Recording = {
				id: nanoid(),
				title: file.name,
				subtitle: '',
				createdAt: now,
				updatedAt: now,
				timestamp: now,
				blob: audioBlob,
				transcribedText: '',
				transcriptionStatus: 'UNPROCESSED',
			};

			// Save recording
			const { error: createError } =
				await services.db.createRecording(newRecording);
			if (createError) return Err(createError);

			// Update query cache
			queryClient.setQueryData<Recording[]>(recordingKeys.all, (oldData) => {
				if (!oldData) return [newRecording];
				return [...oldData, newRecording];
			});
			queryClient.setQueryData<Recording>(
				recordingKeys.byId(() => newRecording.id),
				newRecording,
			);
			queryClient.invalidateQueries({
				queryKey: recordingKeys.latest,
			});

			// Trigger transcription
			transcription.transcribeRecording.execute(newRecording);

			return Ok(newRecording);
		},
	}),
};
