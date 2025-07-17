<script
	lang="ts"
	generics="TItem extends { value: string; label: string; disabled?: boolean }"
>
	import { Label } from '@repo/ui/label';
	import * as Select from '@repo/ui/select';
	import { cn } from '@repo/ui/utils';
	import type { Snippet } from 'svelte';

	type T = TItem['value'];

	let {
		id,
		label,
		items = [],
		selected,
		onSelectedChange,
		placeholder = 'Select an option',
		class: className,
		disabled = false,
		hideLabel = false,
		description,
		renderOption = defaultRenderOption,
	}: {
		id: string;
		label: string;
		items: TItem[];
		selected: T;
		onSelectedChange: (selected: T) => void;
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		hideLabel?: boolean;
		description?: string | Snippet;
		/**
		 * Custom snippet for rendering select option content.
		 * Receives an item object and should return the desired display.
		 * If not provided, defaults to showing the item's label.
		 */
		renderOption?: Snippet<[{ item: TItem }]>;
	} = $props();

	const selectedLabel = $derived(
		items.find((item) => item.value === selected)?.label,
	);
</script>

{#snippet defaultRenderOption({ item }: { item: TItem })}
	{item.label}
{/snippet}

<div class="flex flex-col gap-2">
	<Label class={cn('text-sm', hideLabel && 'sr-only')} for={id}>
		{label}
	</Label>
	<Select.Root
		type="single"
		{items}
		value={selected}
		onValueChange={(selected) => {
			const selectedValue = selected as T;
			onSelectedChange(selectedValue);
		}}
		{disabled}
	>
		<Select.Trigger class={cn('w-full', className)}>
			{selectedLabel ?? placeholder}
		</Select.Trigger>
		<Select.Content>
			{#each items as item}
				<Select.Item
					value={item.value}
					label={item.label}
					disabled={item.disabled}
				>
					{@render renderOption({ item })}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
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
