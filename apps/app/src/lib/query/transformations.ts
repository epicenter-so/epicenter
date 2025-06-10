import { defineMutation, defineQuery, queryClient } from '$lib/query';
import type { Transformation } from '$lib/services/db/DbService';
import { DbTransformationsService } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok } from '@epicenterhq/result';
import type { Accessor } from '@tanstack/svelte-query';

// Define the query key as a constant array
export const transformationsKeys = {
	all: ['transformations'] as const,
	byId: (id: string) => ['transformations', id] as const,
};

export const transformations = {
	queries: {
		getAllTransformations: defineQuery({
			queryKey: transformationsKeys.all,
			resultQueryFn: () => DbTransformationsService.getAllTransformations(),
		}),
		getTransformationById: (id: Accessor<string>) =>
			defineQuery({
				queryKey: transformationsKeys.byId(id()),
				resultQueryFn: () =>
					DbTransformationsService.getTransformationById(id()),
				initialData: () =>
					queryClient
						.getQueryData<Transformation[]>(transformationsKeys.all)
						?.find((t) => t.id === id()),
				initialDataUpdatedAt: () =>
					queryClient.getQueryState(transformationsKeys.byId(id()))
						?.dataUpdatedAt,
			}),
	},
	mutations: {
		createTransformation: defineMutation({
			mutationKey: ['transformations', 'createTransformation'] as const,
			resultMutationFn: async (transformation: Transformation) => {
				const { data, error } =
					await DbTransformationsService.createTransformation(transformation);
				if (error) return Err(error);

				queryClient.setQueryData<Transformation[]>(
					transformationsKeys.all,
					(oldData) => {
						if (!oldData) return [transformation];
						return [...oldData, transformation];
					},
				);
				queryClient.setQueryData<Transformation>(
					transformationsKeys.byId(transformation.id),
					transformation,
				);

				return Ok(data);
			},
		}),
		updateTransformation: defineMutation({
			mutationKey: ['transformations', 'updateTransformation'] as const,
			resultMutationFn: async (transformation: Transformation) => {
				const { data, error } =
					await DbTransformationsService.updateTransformation(transformation);
				if (error) return Err(error);

				queryClient.setQueryData<Transformation[]>(
					transformationsKeys.all,
					(oldData) => {
						if (!oldData) return [transformation];
						return oldData.map((item) =>
							item.id === transformation.id ? transformation : item,
						);
					},
				);
				queryClient.setQueryData<Transformation>(
					transformationsKeys.byId(transformation.id),
					transformation,
				);

				return Ok(data);
			},
		}),
		updateTransformationWithToast: () =>
			defineMutation({
				mutationKey: [
					'transformations',
					'updateTransformationWithToast',
				] as const,
				resultMutationFn: async (transformation: Transformation) => {
					const { data, error } =
						await DbTransformationsService.updateTransformation(transformation);
					if (error) return Err(error);

					queryClient.setQueryData<Transformation[]>(
						transformationsKeys.all,
						(oldData) => {
							if (!oldData) return [transformation];
							return oldData.map((item) =>
								item.id === transformation.id ? transformation : item,
							);
						},
					);
					queryClient.setQueryData<Transformation>(
						transformationsKeys.byId(transformation.id),
						transformation,
					);

					toast.success({
						title: 'Updated transformation!',
						description: 'Your transformation has been updated successfully.',
					});

					return Ok(data);
				},
			}),
		deleteTransformation: defineMutation({
			mutationKey: ['transformations', 'deleteTransformation'] as const,
			resultMutationFn: async (transformation: Transformation) => {
				const { error } =
					await DbTransformationsService.deleteTransformation(transformation);
				if (error) return Err(error);

				queryClient.setQueryData<Transformation[]>(
					transformationsKeys.all,
					(oldData) => {
						if (!oldData) return [];
						return oldData.filter((item) => item.id !== transformation.id);
					},
				);
				queryClient.removeQueries({
					queryKey: transformationsKeys.byId(transformation.id),
				});

				if (
					transformation.id ===
					settings.value['transformations.selectedTransformationId']
				) {
					settings.value = {
						...settings.value,
						'transformations.selectedTransformationId': null,
					};
				}

				return Ok(undefined);
			},
		}),
		deleteTransformations: defineMutation({
			mutationKey: ['transformations', 'deleteTransformations'] as const,
			resultMutationFn: async (transformations: Transformation[]) => {
				const { error } =
					await DbTransformationsService.deleteTransformations(transformations);
				if (error) return Err(error);

				queryClient.setQueryData<Transformation[]>(
					transformationsKeys.all,
					(oldData) => {
						if (!oldData) return [];
						const deletedIds = new Set(transformations.map((t) => t.id));
						return oldData.filter((item) => !deletedIds.has(item.id));
					},
				);
				for (const transformation of transformations) {
					queryClient.removeQueries({
						queryKey: transformationsKeys.byId(transformation.id),
					});
				}

				if (
					transformations.some(
						(t) =>
							t.id ===
							settings.value['transformations.selectedTransformationId'],
					)
				) {
					settings.value = {
						...settings.value,
						'transformations.selectedTransformationId': null,
					};
				}

				return Ok(undefined);
			},
		}),
	},
};
