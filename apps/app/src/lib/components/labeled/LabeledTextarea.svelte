<script lang="ts">
	import { Label } from '@repo/ui/label';
	import { Textarea } from '@repo/ui/textarea';
	import type { Snippet } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		id,
		label,
		value = $bindable(),
		placeholder = '',
		disabled = false,
		description,
		...restProps
	}: HTMLTextareaAttributes & {
		label: string;
		value: string;
		placeholder?: string;
		disabled?: boolean;
		description?: string | Snippet;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	<Label class="text-sm" for={id}>{label}</Label>
	<Textarea {id} bind:value {placeholder} {disabled} {...restProps} />
	{#if description}
		<div class="text-muted-foreground text-sm">
			{#if typeof description === 'string'}
				{description}
			{:else}
				{@render description()}
			{/if}
		</div>
	{/if}
</div>
