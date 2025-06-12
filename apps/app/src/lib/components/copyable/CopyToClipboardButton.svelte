<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import type { Props } from '$lib/components/ui/button';
	import { rpc } from '$lib/query';
	import { toast } from '$lib/services/toast';
	import { createMutation } from '@tanstack/svelte-query';
	import { CheckIcon } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	const copyToClipboard = createMutation(rpc.clipboard.copyToClipboard.options);

	let {
		contentName,
		copyableText,
		viewTransitionName,
		copyIcon: providedCopyIcon,
		class: className,
		size = 'icon',
		variant = 'ghost',
		disabled,
	}: {
		/**
		 * A brief description of what content is being copied (e.g., "transcribed text", "API key").
		 * Used in tooltips, success messages, and error messages to provide context to the user.
		 */
		contentName:
			| 'transcribed text'
			| 'latest transformation run output'
			| 'code';
		copyableText: string;
		viewTransitionName?: string;
		copyIcon?: Snippet;
		class?: string;
	} & Pick<Props, 'disabled' | 'variant' | 'size'> = $props();

	let hasCopied = $state(false);

	$effect(() => {
		if (hasCopied) {
			setTimeout(() => {
				hasCopied = false;
			}, 2000);
		}
	});
</script>

<WhisperingButton
	tooltipContent="Copy {contentName} to clipboard"
	onclick={() =>
		copyToClipboard.mutate(
			{ text: copyableText },
			{
				onSuccess: () => {
					hasCopied = true;
					toast.success({
						title: `Copied ${contentName} to clipboard!`,
						description: copyableText,
					});
				},
				onError: (error) => {
					toast.error({
						title: `Error copying ${contentName} to clipboard`,
						description: error.message,
						action: { type: 'more-details', error },
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
		<CheckIcon class="size-4" />
	{:else}
		{@render copyIcon()}
	{/if}
</WhisperingButton>

{#snippet copyIcon()}
	{#if providedCopyIcon}
		{@render providedCopyIcon()}
	{:else}
		<ClipboardIcon class="size-4" />
	{/if}
{/snippet}
