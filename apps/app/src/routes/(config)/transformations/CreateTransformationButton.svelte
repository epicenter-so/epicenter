<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';
	import { useCreateTransformationWithToast } from '$lib/query/transformations/mutations';
	import { generateDefaultTransformation } from '$lib/services/db';
	import { PlusIcon } from 'lucide-svelte';
	import RenderTransformation from './-components/RenderTransformation.svelte';

	const { createTransformationWithToast } = useCreateTransformationWithToast();

	let isDialogOpen = $state(false);
	let transformation = $state(generateDefaultTransformation());

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
			<Button {...props}>
				<PlusIcon class="size-4 mr-2" />
				Create Transformation
			</Button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content
		class="max-h-[80vh] sm:max-w-7xl h-[80vh]"
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
			<Dialog.Title>Create Transformation</Dialog.Title>
			<Separator />
		</Dialog.Header>

		<RenderTransformation
			{transformation}
			setTransformation={(newTransformation) => {
				transformation = newTransformation;
			}}
			setTransformationDebounced={(newTransformation) => {
				transformation = newTransformation;
			}}
		/>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isDialogOpen = false)}>
				Cancel
			</Button>
			<Button
				type="submit"
				onclick={() =>
					createTransformationWithToast.mutate(
						$state.snapshot(transformation),
						{
							onSuccess: () => {
								isDialogOpen = false;
								transformation = generateDefaultTransformation();
							},
						},
					)}
			>
				Create
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
