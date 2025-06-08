import { queryClient } from '$lib/query';
import type {
	DbServiceErrorProperties,
	Transformation,
} from '$lib/services/db/DbService';
import { DbTransformationsService } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok } from '@epicenterhq/result';
import type {
	CreateResultMutationOptions,
	CreateResultQueryOptions,
} from '@tanstack/svelte-query';
import type { Accessor } from './types';

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
		createTransformation: () =>
			({
				mutationFn: (transformation) =>
					DbTransformationsService.createTransformation(transformation),
				onSuccess: (transformation) => {
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
				},
			}) satisfies CreateResultMutationOptions<
				Transformation,
				DbServiceErrorProperties,
				Transformation
			>,
		updateTransformation: () =>
			({
				mutationFn: async (transformation: Transformation) => {
					const {
						data: updatedTransformation,
						error: updateTransformationError,
					} =
						await DbTransformationsService.updateTransformation(transformation);
					if (updateTransformationError) return Err(updateTransformationError);

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

					return Ok(updatedTransformation);
				},
			}) satisfies CreateResultMutationOptions<
				Transformation,
				DbServiceErrorProperties,
				Parameters<typeof DbTransformationsService.updateTransformation>[0]
			>,
		updateTransformationWithToast: () =>
			({
				mutationFn: async (
					...params: Parameters<
						typeof DbTransformationsService.updateTransformation
					>
				) => {
					const {
						data: updatedTransformation,
						error: updateTransformationError,
					} = await DbTransformationsService.updateTransformation(...params);
					if (updateTransformationError) {
						toast.error({
							title: 'Failed to update transformation!',
							description: 'Your transformation could not be updated.',
							action: {
								type: 'more-details',
								error: updateTransformationError,
							},
						});
						throw updateTransformationError;
					}
					return updatedTransformation;
				},
				onSuccess: (transformation) => {
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
				},
			}) satisfies CreateResultMutationOptions<
				Transformation,
				DbServiceErrorProperties,
				Parameters<typeof DbTransformationsService.updateTransformation>[0]
			>,
		deleteTransformation: () =>
			({
				mutationFn: (transformation: Transformation) =>
					DbTransformationsService.deleteTransformation(transformation),
				onSuccess: (_, transformation) => {
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
				},
			}) satisfies CreateResultMutationOptions<
				void,
				DbServiceErrorProperties,
				Parameters<typeof DbTransformationsService.deleteTransformation>[0]
			>,
		deleteTransformations: () =>
			({
				mutationFn: (transformations) =>
					DbTransformationsService.deleteTransformations(transformations),
				onSuccess: (_, transformations) => {
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
				},
			}) satisfies CreateResultMutationOptions<
				void,
				DbServiceErrorProperties,
				Transformation[]
			>,
	},
};
