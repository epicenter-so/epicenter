<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const copyableVariants = tv({
		base: 'relative whitespace-normal rounded p-4 pr-12 text-sm',
		variants: {
			variant: {
				code: 'bg-muted text-muted-foreground font-semibold font-mono',
				text: 'bg-muted text-muted-foreground',
				error: 'bg-destructive/10 text-destructive',
			},
		},
	});

	export type CopyableVariants = VariantProps<
		typeof copyableVariants
	>['variant'];
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import CopyToClipboardButton from './CopyToClipboardButton.svelte';
	import { Label } from '../ui/label';

	const {
		label,
		hideLabel,
		copyableText,
		variant,
	}: {
		label: string;
		hideLabel?: boolean;
		copyableText: string;
		variant: CopyableVariants;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	<Label class={cn('text-sm', hideLabel && 'sr-only')}>
		{label}
	</Label>
	<pre class={copyableVariants({ variant })}>
{copyableText}
	<CopyToClipboardButton
			class="absolute right-4 top-1/2 -translate-y-1/2"
			contentName={variant === 'code' ? 'code' : 'transcribed text'}
			{copyableText}></CopyToClipboardButton>
</pre>
</div>
