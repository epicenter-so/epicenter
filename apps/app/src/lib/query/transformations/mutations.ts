import type { Transformation } from '$lib/services/db';
import { DbTransformationsService } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { createMutation } from '@tanstack/svelte-query';
import { queryClient } from '..';
import { transformationsKeys } from './queries';
import { Err, Ok } from '@epicenterhq/result';

export function useCreateTransformationWithToast() {
	return {
		createTransformationWithToast: createMutation(() => ({
			mutationFn: async (
				...params: Parameters<
					typeof DbTransformationsService.createTransformation
				>
			) => {
				const { data: transformation, error: createTransformationError } =
					await DbTransformationsService.createTransformation(...params);
				if (createTransformationError) {
					toast.error({
						title: 'Failed to create transformation!',
						description: 'Your transformation could not be created.',
						action: { type: 'more-details', error: createTransformationError },
					});
					throw createTransformationError;
				}
				return transformation;
			},
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

				toast.success({
					title: 'Created transformation!',
					description: 'Your transformation has been created successfully.',
				});
			},
		})),
	};
}

export function useUpdateTransformation() {
	return {
		updateTransformation: createMutation(() => ({
			mutationFn: async (transformation: Transformation) => {
				const {
					data: updatedTransformation,
					error: updateTransformationError,
				} = await DbTransformationsService.updateTransformation(transformation);
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
		})),
	};
}

export function useUpdateTransformationWithToast() {
	return {
		updateTransformationWithToast: createMutation(() => ({
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
						action: { type: 'more-details', error: updateTransformationError },
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
		})),
	};
}

export function useDeleteTransformationWithToast() {
	return {
		deleteTransformationWithToast: createMutation(() => ({
			mutationFn: async (transformation: Transformation) => {
				const { error: deleteTransformationError } =
					await DbTransformationsService.deleteTransformation(transformation);
				if (deleteTransformationError) {
					toast.error({
						title: 'Failed to delete transformation!',
						description: 'Your transformation could not be deleted.',
						action: { type: 'more-details', error: deleteTransformationError },
					});
					throw deleteTransformationError;
				}
				return Ok(undefined);
			},
			onSuccess: (deletedTransformation) => {
				queryClient.setQueryData<Transformation[]>(
					transformationsKeys.all,
					(oldData) => {
						if (!oldData) return [];
						return oldData.filter(
							(item) => item.id !== deletedTransformation.id,
						);
					},
				);
				queryClient.removeQueries({
					queryKey: transformationsKeys.byId(deletedTransformation.id),
				});

				if (
					deletedTransformation.id ===
					settings.value['transformations.selectedTransformationId']
				) {
					settings.value = {
						...settings.value,
						'transformations.selectedTransformationId': null,
					};
				}

				toast.success({
					title: 'Deleted transformation!',
					description: 'Your transformation has been deleted successfully.',
				});
			},
		})),
	};
}

export function useDeleteTransformationsWithToast() {
	return {
		deleteTransformationsWithToast: createMutation(() => ({
			mutationFn: async (transformations: Transformation[]) => {
				const { error: deleteTransformationsError } =
					await DbTransformationsService.deleteTransformations(transformations);
				if (deleteTransformationsError) {
					toast.error({
						title: 'Failed to delete transformations!',
						description: 'Your transformations could not be deleted.',
						action: { type: 'more-details', error: deleteTransformationsError },
					});
					throw deleteTransformationsError;
				}
				return transformations;
			},
			onSuccess: (deletedTransformations) => {
				queryClient.setQueryData<Transformation[]>(
					transformationsKeys.all,
					(oldData) => {
						if (!oldData) return [];
						const deletedIds = new Set(deletedTransformations.map((t) => t.id));
						return oldData.filter((item) => !deletedIds.has(item.id));
					},
				);
				for (const transformation of deletedTransformations) {
					queryClient.removeQueries({
						queryKey: transformationsKeys.byId(transformation.id),
					});
				}

				if (
					deletedTransformations.some(
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

				toast.success({
					title: 'Deleted transformations!',
					description: 'Your transformations have been deleted successfully.',
				});
			},
		})),
	};
}
