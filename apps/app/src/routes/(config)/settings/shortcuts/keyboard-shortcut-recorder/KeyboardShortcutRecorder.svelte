<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import type { Command } from '@repo/shared';
	import { XIcon } from 'lucide-svelte';
	import { keyUtils } from './key-mappers';

	const {
		command,
		placeholder = 'Press a key combination',
		autoFocus = false,
		keyCombination,
		isListening,
		onOpenChange,
		onStartListening,
		onClear,
	}: {
		command: Command;
		placeholder?: string;
		autoFocus?: boolean;
		keyCombination: string | null;
		isListening: boolean;
		onOpenChange: (isOpen: boolean) => void;
		onStartListening: () => void;
		onClear: () => void;
	} = $props();

	let isPopoverOpen = $state(false);

	// Handle popover open/close
	$effect(() => {
		onOpenChange(isPopoverOpen);
	});
</script>

<Popover.Root
	open={isPopoverOpen}
	onOpenChange={(isOpen) => {
		isPopoverOpen = isOpen;
		if (isOpen && autoFocus) {
			setTimeout(() => {
				onStartListening();
			}, 100);
		}
	}}
>
	<Popover.Trigger class="inline-flex items-center gap-1">
		{#if keyCombination}
			{#each keyCombination.split('+') as key}
				<kbd
					class="inline-flex h-6 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground"
				>
					{keyUtils.renderKeySymbol(key)}
				</kbd>
			{/each}
			<WhisperingButton
				size="icon"
				variant="ghost"
				onclick={(e) => {
					e.stopPropagation();
					onClear();
				}}
				tooltipContent="Clear shortcut"
			>
				<XIcon class="h-4 w-4" />
			</WhisperingButton>
		{:else}
			<button
				class="text-sm text-muted-foreground hover:text-foreground hover:underline"
			>
				Add shortcut
			</button>
		{/if}
	</Popover.Trigger>

	<Popover.Content class="w-80 p-4" align="end">
		<div class="space-y-4">
			<div>
				<h4 class="font-medium leading-none mb-2">
					{command.title}
				</h4>
				<p class="text-sm text-muted-foreground">Set a keyboard shortcut</p>
			</div>

			<div class="space-y-2">
				<button
					type="button"
					class={cn(
						'relative flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
						isListening && 'ring-2 ring-ring ring-offset-2',
					)}
					onclick={(e) => {
						e.stopPropagation();
						onStartListening();
					}}
					tabindex="0"
					aria-label={isListening
						? 'Recording keyboard shortcut'
						: 'Click to record keyboard shortcut'}
				>
					<div class="flex flex-1 items-center justify-between">
						<div
							class="flex items-center gap-1.5 overflow-x-auto scrollbar-none pr-2 flex-grow"
						>
							{#if keyCombination}
								{#each keyCombination.split('+') as key}
									<kbd
										class="inline-flex h-6 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground"
									>
										{keyUtils.renderKeySymbol(key)}
									</kbd>
								{/each}
							{:else}
								<span class="text-muted-foreground truncate">
									{placeholder}
								</span>
							{/if}
						</div>
					</div>

					{#if isListening}
						<div
							class="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md border border-input animate-in fade-in-0 zoom-in-95 z-10"
							aria-live="polite"
						>
							<div class="flex flex-col items-center gap-1 px-4 py-2">
								<p class="text-sm font-medium">Press key combination</p>
								<p class="text-xs text-muted-foreground">Esc to cancel</p>
							</div>
						</div>
					{/if}
				</button>
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
