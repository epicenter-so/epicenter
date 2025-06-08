<script lang="ts">
	import { ClipboardIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import { copyTextToClipboardWithToast } from '$lib/query/clipboard';
	import { mergeProps } from 'bits-ui';
	import WhisperingTooltip from '../WhisperingTooltip.svelte';

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
					copyTextToClipboardWithToast(
						{
							label: 'transcribed text',
							text: text,
						},
						{ onSuccess: () => (isDialogOpen = false) },
					);
				}}
			>
				<ClipboardIcon class="size-4" />
				Copy Text
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
