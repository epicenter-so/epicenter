<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const copyableVariants = tv({
		base: 'relative whitespace-normal rounded p-4 pr-12 text-sm',
		variants: {
			variant: {
				code: 'bg-muted font-mono',
				error: 'bg-destructive/10 text-destructive',
				text: 'bg-muted text-muted-foreground',
			},
		},
	});

	export type CopyableVariants = VariantProps<
		typeof copyableVariants
	>['variant'];
</script>

<script lang="ts">
	import { ClipboardIcon } from '$lib/components/icons';
	import { cn } from '@repo/ui/utils';

	import CopyToClipboardButton from './CopyToClipboardButton.svelte';

	const {
		class: className,
		copyableText,
		variant,
	}: {
		class?: string;
		copyableText: string;
		variant: CopyableVariants;
	} = $props();
</script>

<pre class={cn(copyableVariants({ variant }), className)}>
{copyableText}
	<CopyToClipboardButton
		class="absolute right-4 top-1/2 -translate-y-1/2"
		contentDescription={variant === 'code' ? 'code' : 'transcribed text'}
		textToCopy={copyableText}>
		<ClipboardIcon class="size-4" />
	</CopyToClipboardButton>
</pre>
