import { defineMutation, queryClient } from '$lib/query';
import type {
	DbServiceErrorProperties,
	Transformation,
} from '$lib/services/db/DbService';
import { DbTransformationsService } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import type { CreateResultQueryOptions } from '@tanstack/svelte-query';
import type { Accessor } from './types';
import { Err, Ok } from '@epicenterhq/result';

// Define the query key as a constant array
export const transformationsKeys = {
	all: ['transformations'] as const,
	byId: (id: string) => ['transformations', id] as const,
};

export const transformations = {
	queries: {
		getAllTransformations: () =>
			({
				queryKey: transformationsKeys.all,
				queryFn: () => DbTransformationsService.getAllTransformations(),
			}) satisfies CreateResultQueryOptions<
				Transformation[],
				DbServiceErrorProperties
			>,
		getTransformationById: (id: Accessor<string>) => () =>
			({
				queryKey: transformationsKeys.byId(id()),
				queryFn: () => DbTransformationsService.getTransformationById(id()),
				initialData: () =>
					queryClient
						.getQueryData<Transformation[]>(transformationsKeys.all)
						?.find((t) => t.id === id()),
				initialDataUpdatedAt: () =>
					queryClient.getQueryState(transformationsKeys.byId(id()))
						?.dataUpdatedAt,
			}) satisfies CreateResultQueryOptions<
				Transformation | null,
				DbServiceErrorProperties
			>,
	},
	mutations: {
		createTransformation: defineMutation({
			mutationKey: ['transformations', 'createTransformation'] as const,
			mutationFn: async (transformation: Transformation) => {
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
			mutationFn: async (transformation: Transformation) => {
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
				mutationFn: async (transformation: Transformation) => {
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
			mutationFn: async (transformation: Transformation) => {
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
			mutationFn: async (transformations: Transformation[]) => {
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
