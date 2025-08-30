<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	import { Label } from '@repo/ui/label';
	import { Textarea } from '@repo/ui/textarea';

	let {
		description,
		disabled = false,
		id,
		label,
		placeholder = '',
		value = $bindable(),
		...restProps
	}: HTMLTextareaAttributes & {
		description?: Snippet | string;
		disabled?: boolean;
		label: string;
		placeholder?: string;
		value: string;
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
