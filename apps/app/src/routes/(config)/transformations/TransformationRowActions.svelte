<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { useDeleteTransformationWithToast } from '$lib/query/transformations/mutations';
	import { useTransformationQuery } from '$lib/query/transformations/queries';
	import EditTransformationDialog from './EditTransformationDialog.svelte';

	const { deleteTransformationWithToast } = useDeleteTransformationWithToast();

	let { transformationId }: { transformationId: string } = $props();

	const { transformationQuery } = useTransformationQuery(
		() => transformationId,
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
					onConfirm: () => deleteTransformationWithToast.mutate(transformation),
				});
			}}
			variant="ghost"
			size="icon"
		>
			<TrashIcon class="size-4" />
		</WhisperingButton>
	{/if}
</div>
