<script lang="ts">
	import { rpc } from '$lib/query';
	import { createMutation } from '@tanstack/svelte-query';
	import WhisperingButton from '../WhisperingButton.svelte';

	const {
		copyableText,
		class: className,
	}: {
		copyableText: string;
		class?: string;
	} = $props();

	let copied = $state(false);

	const copyToClipboardMutation = createMutation(
		rpc.clipboard.copyToClipboard.options,
	);
</script>

<WhisperingButton
	tooltipContent={copied ? 'Copied!' : 'Copy to clipboard'}
	class="inline-flex cursor-pointer rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-muted-foreground hover:bg-muted/80"
	onclick={() =>
		copyToClipboardMutation.mutate(
			{ text: copyableText },
			{
				onSuccess: () => {
					copied = true;
					setTimeout(() => {
						copied = false;
					}, 2000);
				},
			},
		)}
>
	{copyableText}
</WhisperingButton>
