<script lang="ts">
	import { ClipboardIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import { queries } from '$lib/query';
	import { mergeProps } from 'bits-ui';
	import WhisperingTooltip from '../WhisperingTooltip.svelte';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from '$lib/services/toast';

	let {
		id,
		text,
		label,
		rows = 2,
	}: {
		id: string;
		text: string;
		label: string;
		rows?: number;
	} = $props();

	let isDialogOpen = $state(false);

	const copyToClipboard = createMutation(
		queries.clipboard.copyToClipboard.options,
	);
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger {id}>
		{#snippet child({ props: dialogTriggerProps })}
			<WhisperingTooltip {id} tooltipContent="View {label}">
				{#snippet trigger({ tooltipProps, tooltip })}
					<Textarea
						{...mergeProps(tooltipProps, dialogTriggerProps)}
						class="min-h-0 h-full resize-none text-wrap text-left text-sm leading-snug hover:cursor-pointer hover:bg-accent hover:text-accent-foreground"
						readonly
						value={text}
						style="view-transition-name: {id}"
						{rows}
					/>
					<span class="sr-only">
						{@render tooltip()}
					</span>
				{/snippet}
			</WhisperingTooltip>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="max-w-4xl">
		<Card.Title class="text-lg">Transcribed Text</Card.Title>
		<Textarea readonly value={text} rows={20} />
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isDialogOpen = false)}>
				Close
			</Button>
			<Button
				variant="outline"
				onclick={() => {
					copyToClipboard.mutate(
						{ text },
						{
							onSuccess: () => {
								isDialogOpen = false;
								toast.success({
									title: `Copied transcribed text to clipboard!`,
									description: text,
								});
							},
							onError: (error) => {
								toast.error({
									title: `Error copying transcribed text to clipboard`,
									description: error.message,
									action: { type: 'more-details', error },
								});
							},
						},
					);
				}}
			>
				<ClipboardIcon class="size-4" />
				Copy Text
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
