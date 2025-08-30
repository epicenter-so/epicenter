<script lang="ts">
	import type { Props } from '@repo/ui/button';
	import type { Snippet } from 'svelte';

	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { rpc } from '$lib/query';
	import { CheckIcon } from '@lucide/svelte';
	import { createMutation } from '@tanstack/svelte-query';

	const copyToClipboard = createMutation(rpc.text.copyToClipboard.options);

	let {
		children,
		class: className,
		contentDescription,
		copiedContent,
		disabled,
		size = 'icon',
		textToCopy,
		variant = 'ghost',
		viewTransitionName,
	}: Partial<Pick<Props, 'disabled' | 'size' | 'variant'>> & {
		/**
		 * The content to display in the button's default state.
		 * This is mandatory and can contain any combination of text, icons, or other elements.
		 */
		children: Snippet;
		class?: string;
		/**
		 * A description of the content being copied (e.g., "transcribed text", "API key").
		 * Used in tooltips and toast messages to provide context to the user.
		 */
		contentDescription: string;
		/**
		 * The content to display when the copy operation succeeds.
		 * Defaults to a check icon if not provided.
		 * Can also be text.
		 */
		copiedContent?: Snippet;
		/**
		 * The text that will be copied to the clipboard when the button is clicked.
		 */
		textToCopy: string;
		viewTransitionName?: string;
	} = $props();

	let hasCopied = $state(false);
</script>

<WhisperingButton
	tooltipContent="Copy {contentDescription} to clipboard"
	onclick={() =>
		copyToClipboard.mutate(
			{ text: textToCopy },
			{
				onError: (error) => {
					rpc.notify.error.execute({
						title: `Error copying ${contentDescription} to clipboard`,
						description: error.message,
						action: { error, type: 'more-details' },
					});
				},
				onSuccess: () => {
					hasCopied = true;
					setTimeout(() => {
						hasCopied = false;
					}, 2000);
					rpc.notify.success.execute({
						title: `Copied ${contentDescription} to clipboard!`,
						description: textToCopy,
					});
				},
			},
		)}
	style={viewTransitionName
		? `view-transition-name: ${viewTransitionName};`
		: undefined}
	class={className}
	{size}
	{variant}
	{disabled}
>
	<span class="sr-only">Copy</span>
	{#if hasCopied}
		{#if copiedContent}
			{@render copiedContent()}
		{:else}
			<CheckIcon class="size-4" />
		{/if}
	{:else}
		{@render children()}
	{/if}
</WhisperingButton>
