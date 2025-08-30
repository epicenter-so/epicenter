<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Label } from '@repo/ui/label';
	import { Switch } from '@repo/ui/switch';

	let {
		description,
		checked = $bindable(),
		disabled = $bindable(),
		id,
		label,
		onCheckedChange,
	}: {
		checked: boolean;
		description?: string;
		disabled?: boolean;
		id: string;
		label: Snippet | string;
		onCheckedChange?: (value: boolean) => void;
	} = $props();
</script>

<div class="flex items-center gap-2">
	<Switch {id} aria-labelledby={id} bind:checked {onCheckedChange} {disabled} />
	<Label for={id}>
		{#if typeof label === 'string'}
			{label}
		{:else}
			{@render label()}
		{/if}
	</Label>
</div>

{#if description}
	<p class="text-sm text-muted-foreground">{description}</p>
{/if}
