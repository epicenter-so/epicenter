<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { rpc } from '$lib/query';
	import { Skeleton } from '@repo/ui/skeleton';
	import { createMutation, createQuery } from '@tanstack/svelte-query';

	import EditTransformationModal from './EditTransformationModal.svelte';

	let { transformationId }: { transformationId: string } = $props();

	const deleteTransformation = createMutation(
		rpc.transformations.mutations.deleteTransformation.options,
	);

	const transformationQuery = createQuery(
		rpc.transformations.queries.getTransformationById(() => transformationId)
			.options,
	);
	const transformation = $derived(transformationQuery.data);
</script>

<div class="flex items-center gap-1">
	{#if !transformation}
		<Skeleton class="size-8 md:hidden" />
		<Skeleton class="size-8" />
	{:else}
		<EditTransformationModal {transformation} />

		<WhisperingButton
			tooltipContent="Delete transformation"
			onclick={() => {
				confirmationDialog.open({
					title: 'Delete transformation',
					confirmText: 'Delete',
					onConfirm: () =>
						deleteTransformation.mutate(transformation, {
							onError: (error) => {
								rpc.notify.error.execute({
									title: 'Failed to delete transformation!',
									description: 'Your transformation could not be deleted.',
									action: { error, type: 'more-details' },
								});
							},
							onSuccess: () => {
								rpc.notify.success.execute({
									title: 'Deleted transformation!',
									description:
										'Your transformation has been deleted successfully.',
								});
							},
						}),
					subtitle: 'Are you sure you want to delete this transformation?',
				});
			}}
			variant="ghost"
			size="icon"
		>
			<TrashIcon class="size-4" />
		</WhisperingButton>
	{/if}
</div>
