<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import * as Popover from '@repo/ui/popover';
	import { useCombobox } from '@repo/ui/hooks';

	import { EllipsisIcon } from '@lucide/svelte';

	let { children } = $props();

	const combobox = useCombobox();
</script>

<Popover.Root bind:open={combobox.open}>
	<Popover.Trigger bind:ref={combobox.triggerRef}>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
				tooltipContent="Overflow Actions"
				role="combobox"
				aria-expanded={combobox.open}
				variant="ghost"
				size="icon"
				only="mobile"
			>
				<EllipsisIcon class="size-4" />
			</WhisperingButton>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="flex w-auto m-1 p-1 z-20">
		{@render children()}
	</Popover.Content>
</Popover.Root>
