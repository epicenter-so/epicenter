<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { PencilIcon as EditIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';
	import {
		useDeleteTransformationWithToast,
		useUpdateTransformationWithToast,
	} from '$lib/query/transformations/mutations';
	import type { Transformation } from '$lib/services/db';
	import { DEBOUNCE_TIME_MS } from '@repo/shared';
	import { HistoryIcon, Loader2Icon, PlayIcon, TrashIcon } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import RenderTransformation from './-components/RenderTransformation.svelte';
	import MarkTransformationActiveButton from './MarkTransformationActiveButton.svelte';

	const { updateTransformationWithToast } = useUpdateTransformationWithToast();
	const { deleteTransformationWithToast } = useDeleteTransformationWithToast();

	let {
		transformation,
		class: className,
	}: { transformation: Transformation; class?: string } = $props();

	let isDialogOpen = $state(false);

	let saveTimeout: NodeJS.Timeout;
	function debouncedSetTransformation(newTransformation: Transformation) {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			updateTransformationWithToast.mutate($state.snapshot(newTransformation));
		}, DEBOUNCE_TIME_MS);
	}

	onDestroy(() => {
		clearTimeout(saveTimeout);
	});
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
	<Dialog.Content class="max-h-[80vh] max-w-7xl h-[80vh]">
		<Dialog.Header>
			<Dialog.Title>Transformation Settings</Dialog.Title>
			<Separator />
		</Dialog.Header>

		<RenderTransformation
			{transformation}
			setTransformation={(newTransformation) => {
				updateTransformationWithToast.mutate(
					$state.snapshot(newTransformation),
				);
			}}
			setTransformationDebounced={(newTransformation) => {
				debouncedSetTransformation(newTransformation);
			}}
		/>

		<Dialog.Footer>
			<Button
				onclick={() => {
					confirmationDialog.open({
						title: 'Delete transformation',
						subtitle: 'Are you sure? This action cannot be undone.',
						confirmText: 'Delete',
						onConfirm: () => {
							deleteTransformationWithToast.mutate(
								$state.snapshot(transformation),
								{
									onSettled: () => {
										isDialogOpen = false;
									},
								},
							);
						},
					});
				}}
				variant="destructive"
				disabled={deleteTransformationWithToast.isPending}
			>
				{#if deleteTransformationWithToast.isPending}
					<Loader2Icon class="mr-2 size-4 animate-spin" />
				{:else}
					<TrashIcon class="size-4 mr-1" />
				{/if}
				Delete
			</Button>
			<div class="flex items-center gap-2">
				<MarkTransformationActiveButton {transformation} />
				<Button variant="outline" onclick={() => (isDialogOpen = false)}>
					Close
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
