<script lang="ts" generics="TColumn extends Column<any, any>">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Column } from '@tanstack/svelte-table';
	import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-svelte';

	let { column, headerText }: { column: TColumn; headerText: string } =
		$props();
</script>

<Button
	variant="ghost"
	onclick={() => {
		column.toggleSorting();
	}}
>
	{headerText}
	{#if column.getIsSorted() === 'asc'}
		<ArrowUpIcon class="ml-2 size-4" />
	{:else if column.getIsSorted() === 'desc'}
		<ArrowDownIcon class="ml-2 size-4" />
	{:else}
		<ArrowUpDownIcon class="ml-2 size-4" />
	{/if}
</Button>
