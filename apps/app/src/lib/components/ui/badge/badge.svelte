<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2',
		variants: {
			variant: {
				id: 'px-1.5 bg-muted text-muted-foreground hover:bg-muted/80 border-transparent font-mono text-xs rounded-md font-normal',
				default:
					'bg-primary text-primary-foreground hover:bg-primary/80 border-transparent',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent',
				destructive:
					'bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent',
				outline: 'text-foreground',
				'status.running': 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
				'status.completed':
					'bg-green-500/10 text-green-500 hover:bg-green-500/20',
				'status.failed': 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = 'default',
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	bind:this={ref}
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
