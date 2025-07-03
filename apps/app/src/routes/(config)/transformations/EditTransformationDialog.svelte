<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { PencilIcon as EditIcon } from '$lib/components/icons';
	import { Editor } from '$lib/components/transformations-editor';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';
	import { rpc } from '$lib/query';
	import type { Transformation } from '$lib/services/db';
	import { toast } from '$lib/toast';
	import { createMutation } from '@tanstack/svelte-query';
	import { HistoryIcon, Loader2Icon, PlayIcon, TrashIcon } from 'lucide-svelte';
	import MarkTransformationActiveButton from './MarkTransformationActiveButton.svelte';

	const updateTransformation = createMutation(
		rpc.transformations.mutations.updateTransformation.options,
	);

	const deleteTransformation = createMutation(
		rpc.transformations.mutations.deleteTransformation.options,
	);

	let {
		transformation,
		class: className,
	}: { transformation: Transformation; class?: string } = $props();

	let isDialogOpen = $state(false);

	/**
	 * A working copy of the transformation that we can safely edit.
	 *
	 * Think of this like making a photocopy of an important document before
	 * making edits - you don't want to accidentally mess up the original.
	 *
	 * Here's how it works:
	 * 1. We get the original transformation data
	 * 2. We make a copy of it (this variable)
	 * 3. User makes changes to the copy
	 * 4. When they save, we send the copy to the server
	 * 5. The server updates the original data
	 * 6. We get the fresh original data back and make a new copy
	 *
	 * This prevents bugs where editing in one place accidentally breaks
	 * something else that's using the same data.
	 */
	let workingCopy = $derived(transformation);

	function promptUserConfirmLeave() {
		confirmationDialog.open({
			title: 'Unsaved changes',
			subtitle: 'You have unsaved changes. Are you sure you want to leave?',
			confirmText: 'Leave',
			onConfirm: () => {
				isDialogOpen = false;
			},
		});
	}
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
				tooltipContent="Edit transformation, test transformation, and view run history"
				variant="ghost"
				class={className}
			>
				<EditIcon class="size-4" />
				<PlayIcon class="size-4" />
				<HistoryIcon class="size-4" />
			</WhisperingButton>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content
		class="max-h-[80vh] sm:max-w-7xl"
		onEscapeKeydown={(e) => {
			e.preventDefault();
			if (isDialogOpen) {
				promptUserConfirmLeave();
			}
		}}
		onInteractOutside={(e) => {
			e.preventDefault();
			if (isDialogOpen) {
				promptUserConfirmLeave();
			}
		}}
	>
		<Dialog.Header>
			<Dialog.Title>Transformation Settings</Dialog.Title>
			<Separator />
		</Dialog.Header>

		<Editor bind:transformation={workingCopy} />

		<Dialog.Footer>
			<Button
				onclick={() => {
					confirmationDialog.open({
						title: 'Delete transformation',
						subtitle: 'Are you sure? This action cannot be undone.',
						confirmText: 'Delete',
						onConfirm: () => {
							deleteTransformation.mutate($state.snapshot(transformation), {
								onSuccess: () => {
									isDialogOpen = false;
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
							});
						},
					});
				}}
				variant="destructive"
				disabled={deleteTransformation.isPending}
			>
				{#if deleteTransformation.isPending}
					<Loader2Icon class="mr-2 size-4 animate-spin" />
				{:else}
					<TrashIcon class="size-4 mr-1" />
				{/if}
				Delete
			</Button>
			<div class="flex items-center gap-2">
				<MarkTransformationActiveButton {transformation} />
				<Button variant="outline" onclick={() => promptUserConfirmLeave()}>
					Close
				</Button>
				<Button
					onclick={() => {
						updateTransformation.mutate($state.snapshot(workingCopy), {
							onSuccess: () => {
								toast.success({
									title: 'Updated transformation!',
									description:
										'Your transformation has been updated successfully.',
								});
								isDialogOpen = false;
							},
							onError: (error) => {
								toast.error({
									title: 'Failed to update transformation!',
									description: 'Your transformation could not be updated.',
									action: { type: 'more-details', error },
								});
							},
						});
					}}
					disabled={updateTransformation.isPending}
				>
					{#if updateTransformation.isPending}
						<Loader2Icon class="mr-2 size-4 animate-spin" />
					{/if}
					Save
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
