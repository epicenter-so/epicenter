<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import { cn } from '@repo/ui/utils';

	let {
		description,
		disabled = false,
		hideLabel = false,
		id,
		label,
		placeholder = '',
		type = 'text',
		value = $bindable(),
		...restProps
	}: HTMLInputAttributes & {
		description?: Snippet | string;
		disabled?: boolean;
		hideLabel?: boolean;
		label: string;
		placeholder?: string;
		type?: 'number' | 'password' | 'text';
		value: string;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	<Label class={cn('text-sm', hideLabel && 'sr-only')} for={id}>
		{label}
	</Label>
	<Input
		{id}
		bind:value
		{placeholder}
		{type}
		{disabled}
		autocomplete="off"
		{...restProps}
	/>
	{#if description}
		{#if typeof description === 'string'}
			<p class="text-muted-foreground text-sm">{description}</p>
		{:else}
			{@render description()}
		{/if}
	{/if}
</div>
