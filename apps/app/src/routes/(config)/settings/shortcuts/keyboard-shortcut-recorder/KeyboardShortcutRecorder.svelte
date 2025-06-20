<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import { createPressedKeys } from '$lib/utils/createPressedKeys.svelte';
	import { Keyboard, Pencil, XIcon } from 'lucide-svelte';
	import { createKeyRecorder } from './create-key-recorder.svelte';

	const {
		title,
		placeholder = 'Press a key combination',
		autoFocus = true,
		keyCombination,
		onRegister,
		onClear,
	}: {
		title: string;
		placeholder?: string;
		autoFocus?: boolean;
		keyCombination: string | null;
		onRegister: (keyCombination: string[]) => void | Promise<void>;
		onClear: () => void | Promise<void>;
	} = $props();

	const pressedKeys = createPressedKeys();

	const keyRecorder = createKeyRecorder({ pressedKeys, onRegister, onClear });

	let isPopoverOpen = $state(false);
	let isManualMode = $state(false);
	let manualValue = $state(keyCombination ?? '');

	$effect(() => {
		manualValue = keyCombination ?? '';
	});
</script>

<Popover.Root
	open={isPopoverOpen}
	onOpenChange={(isOpen) => {
		isPopoverOpen = isOpen;
		if (!isOpen) {
			keyRecorder.stop();
			isManualMode = false;
		}
		if (isOpen && autoFocus && !isManualMode) {
			keyRecorder.start();
		}
	}}
>
	<Popover.Trigger>
		<Button variant="ghost" size="sm" class="h-8 font-normal">
			{#if keyCombination}
				<span class="text-xs">Set shortcut</span>
			{:else}
				<span class="text-xs text-muted-foreground">+ Add</span>
			{/if}
		</Button>
	</Popover.Trigger>

	<Popover.Content
		class="w-80"
		align="end"
		onEscapeKeydown={(e) => {
			if (keyRecorder.isListening) {
				e.preventDefault();
			}
		}}
	>
		<div class="space-y-4">
			<div>
				<h4 class="mb-1 text-sm font-medium leading-none">{title}</h4>
				<p class="text-xs text-muted-foreground">
					{#if isManualMode}
						Enter shortcut manually (e.g., ctrl+shift+a)
					{:else}
						Click to record or edit manually
					{/if}
				</p>
			</div>

			{#if !isManualMode}
				<!-- Recording mode -->
				<button
					type="button"
					class={cn(
						'relative flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
						keyRecorder.isListening && 'ring-2 ring-ring ring-offset-2',
					)}
					onclick={(e) => {
						e.stopPropagation();
						keyRecorder.start();
					}}
					tabindex="0"
					aria-label={keyRecorder.isListening
						? 'Recording keyboard shortcut'
						: 'Click to record keyboard shortcut'}
				>
					<div class="flex w-full items-center justify-between">
						<div
							class="flex flex-grow items-center gap-1.5 overflow-x-auto pr-2 scrollbar-none"
						>
							{#if keyCombination && !keyRecorder.isListening}
								<Badge variant="secondary" class="font-mono text-xs">
									{keyCombination ?? ''}
								</Badge>
							{:else if !keyRecorder.isListening}
								<span class="truncate text-muted-foreground">{placeholder}</span
								>
							{/if}
						</div>
						{#if !keyRecorder.isListening}
							<Keyboard class="size-4 text-muted-foreground" />
						{/if}
					</div>

					{#if keyRecorder.isListening}
						<div
							class="absolute inset-0 z-10 flex animate-in fade-in-0 zoom-in-95 items-center justify-center rounded-md border border-input bg-background/95 backdrop-blur-sm"
							aria-live="polite"
						>
							<div class="flex flex-col items-center gap-1 px-4 py-2">
								<p class="text-sm font-medium">Press key combination</p>
								<p class="text-xs text-muted-foreground">Esc to cancel</p>
							</div>
						</div>
					{/if}
				</button>

				<div class="flex items-center gap-2">
					{#if keyCombination}
						<Button
							variant="outline"
							size="sm"
							class="flex-1"
							onclick={() => keyRecorder.clear()}
						>
							<XIcon class="mr-2 size-3" />
							Clear
						</Button>
					{/if}
					<Button
						variant="outline"
						size="sm"
						class={keyCombination ? 'flex-1' : 'w-full'}
						onclick={() => {
							isManualMode = true;
							manualValue = keyCombination ?? '';
						}}
					>
						<Pencil class="mr-2 size-3" />
						Edit manually
					</Button>
				</div>
			{:else}
				<!-- Manual mode -->
				<form
					onsubmit={(e) => {
						e.preventDefault();
						if (manualValue) {
							keyRecorder.register(manualValue.split('+'));
							isManualMode = false;
						}
					}}
					class="space-y-3"
				>
					<Input
						type="text"
						placeholder="e.g., ctrl+shift+a"
						bind:value={manualValue}
						class="font-mono text-sm"
						autofocus
					/>
					<div class="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							class="flex-1"
							onclick={() => {
								isManualMode = false;
								manualValue = keyCombination ?? '';
							}}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							class="flex-1"
							disabled={!manualValue.trim()}
						>
							Save
						</Button>
					</div>
				</form>
			{/if}
		</div>
	</Popover.Content>
</Popover.Root>
