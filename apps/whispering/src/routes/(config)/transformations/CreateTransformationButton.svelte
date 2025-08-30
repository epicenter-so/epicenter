<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import { Editor } from '$lib/components/transformations-editor';
	import { rpc } from '$lib/query';
	import { generateDefaultTransformation } from '$lib/services/db';
	import { PlusIcon } from '@lucide/svelte';
	import { Button } from '@repo/ui/button';
	import * as Dialog from '@repo/ui/dialog';
	import { Separator } from '@repo/ui/separator';
	import { createMutation } from '@tanstack/svelte-query';

	const createTransformation = createMutation(
		rpc.transformations.mutations.createTransformation.options,
	);

	let isDialogOpen = $state(false);
	let transformation = $state(generateDefaultTransformation());

	function promptUserConfirmLeave() {
		confirmationDialog.open({
			title: 'Unsaved changes',
			confirmText: 'Leave',
			onConfirm: () => {
				isDialogOpen = false;
			},
			subtitle: 'You have unsaved changes. Are you sure you want to leave?',
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
			<Dialog.Title>Create Transformation</Dialog.Title>
			<Separator />
		</Dialog.Header>

		<Editor bind:transformation />

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isDialogOpen = false)}>
				Cancel
			</Button>
			<Button
				type="submit"
				onclick={() =>
					createTransformation.mutate($state.snapshot(transformation), {
						onError: (error) => {
							rpc.notify.error.execute({
								title: 'Failed to create transformation!',
								description: 'Your transformation could not be created.',
								action: { error, type: 'more-details' },
							});
						},
						onSuccess: () => {
							isDialogOpen = false;
							transformation = generateDefaultTransformation();
							rpc.notify.success.execute({
								title: 'Created transformation!',
								description:
									'Your transformation has been created successfully.',
							});
						},
					})}
			>
				Create
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
