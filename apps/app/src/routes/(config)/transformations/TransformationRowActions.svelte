<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { transformations } from '$lib/query/transformations';
	import { toast } from '$lib/services/toast';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import EditTransformationDialog from './EditTransformationDialog.svelte';

	let { transformationId }: { transformationId: string } = $props();

	const deleteTransformation = createMutation(
		transformations.mutations.deleteTransformation.options,
	);

	const transformationQuery = createQuery(
		transformations.queries.getTransformationById(() => transformationId)
			.options,
	);
	const transformation = $derived(transformationQuery.data);
</script>

<div class="flex items-center gap-1">
	{#if !transformation}
		<Skeleton class="size-8 md:hidden" />
		<Skeleton class="size-8" />
	{:else}
		<EditTransformationDialog {transformation} />

		<WhisperingButton
			tooltipContent="Delete transformation"
			onclick={() => {
				confirmationDialog.open({
					title: 'Delete transformation',
					subtitle: 'Are you sure you want to delete this transformation?',
					confirmText: 'Delete',
					onConfirm: () =>
						deleteTransformation.mutate(transformation, {
							onSuccess: () => {
								toast.success({
									title: 'Deleted transformation!',
									description:
										'Your transformation has been deleted successfully.',
								});
							},
							onError: (error) => {
								toast.error({
									title: 'Failed to delete transformation!',
									description: 'Your transformation could not be deleted.',
									action: { type: 'more-details', error },
								});
							},
						}),
				});
			}}
			variant="ghost"
			size="icon"
		>
			<TrashIcon class="size-4" />
		</WhisperingButton>
	{/if}
</div>
