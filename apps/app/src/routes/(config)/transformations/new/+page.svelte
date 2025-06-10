<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { transformations } from '$lib/query/transformations';
	import { generateDefaultTransformation } from '$lib/services/db';
	import { toast } from '$lib/services/toast';
	import { createMutation } from '@tanstack/svelte-query';
	import RenderTransformation from '../-components/RenderTransformation.svelte';

	const createTransformation = createMutation(
		transformations.mutations.createTransformation.options,
	);

	let transformation = $state(generateDefaultTransformation());
</script>

<Card.Root class="w-full max-w-4xl">
	<Card.Header>
		<Card.Title>Create Transformation</Card.Title>
		<Card.Description>
			Create a new transformation to transform text.
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		<RenderTransformation
			{transformation}
			setTransformation={(newTransformation) => {
				transformation = newTransformation;
			}}
			setTransformationDebounced={(newTransformation) => {
				transformation = newTransformation;
			}}
		/>
		<Card.Footer class="flex justify-end gap-2">
			<Button
				onclick={() =>
					createTransformation.mutate($state.snapshot(transformation), {
						onSuccess: () => {
							goto('/transformations'),
								toast.success({
									title: 'Created transformation!',
									description:
										'Your transformation has been created successfully.',
								});
						},
						onError: (error) => {
							toast.error({
								title: 'Failed to create transformation!',
								description: 'Your transformation could not be created.',
								action: { type: 'more-details', error },
							});
						},
					})}
			>
				Create Transformation
			</Button>
		</Card.Footer>
	</Card.Content>
</Card.Root>
