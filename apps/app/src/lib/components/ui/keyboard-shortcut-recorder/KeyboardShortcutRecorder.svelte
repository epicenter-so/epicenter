<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils';
	import { X } from 'lucide-svelte';

	const {
		value = '',
		placeholder = 'Click to record shortcut',
		onValueChange,
		disabled = false,
		className = '',
	} = $props<{
		value: string;
		placeholder?: string;
		onValueChange: (value: string) => void;
		disabled?: boolean;
		className?: string;
	}>();

	// State
	let isRecording = $state(false);
	let keys = $state<string[]>([]);
	let displayValue = $derived(value || placeholder);

	// Derived values
	$effect(() => {
		if (value) {
			keys = value.split('+');
		} else {
			keys = [];
		}
	});

	// Event handlers
	function startRecording() {
		if (disabled) return;
		isRecording = true;
		keys = [];
	}

	function stopRecording() {
		isRecording = false;
	}

	function clearShortcut() {
		keys = [];
		onValueChange('');
		stopRecording();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!isRecording) return;

		event.preventDefault();
		event.stopPropagation();

		// Reset keys on new recording session
		if (keys.length === 0 || event.key === 'Escape') {
			keys = [];
		}

		if (event.key === 'Escape') {
			stopRecording();
			return;
		}

		// Map key names to their display format
		const keyMap: Record<string, string> = {
			Control: 'ctrl',
			Meta: 'command',
			Alt: 'alt',
			Shift: 'shift',
			' ': 'space',
			ArrowUp: 'up',
			ArrowDown: 'down',
			ArrowLeft: 'left',
			ArrowRight: 'right',
			Escape: 'esc',
		};

		// Collect all pressed modifier keys
		const modifiers: string[] = [];
		if (event.ctrlKey) modifiers.push('ctrl');
		if (event.metaKey) modifiers.push('command');
		if (event.altKey) modifiers.push('alt');
		if (event.shiftKey) modifiers.push('shift');

		// Get the main key (non-modifier)
		let mainKey = event.key;

		// Convert to friendly format if needed
		if (keyMap[mainKey]) {
			mainKey = keyMap[mainKey];
		} else if (mainKey.length === 1) {
			// For single character keys, use lowercase
			mainKey = mainKey.toLowerCase();
		}

		// Don't add duplicate modifiers
		if (
			!modifiers.includes(mainKey) ||
			!Object.values(keyMap).includes(mainKey)
		) {
			// Build the final key combination
			const newKeys = [...modifiers, mainKey];
			keys = newKeys;

			// Update the value
			const shortcutValue = newKeys.join('+');
			onValueChange(shortcutValue);

			// Stop recording after a valid combination is entered
			stopRecording();
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

<div
	class={cn(
		'relative flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
		isRecording && 'ring-2 ring-ring ring-offset-2',
		disabled && 'cursor-not-allowed opacity-50',
		className,
	)}
	on:click={startRecording}
	role="button"
	tabindex="0"
	aria-disabled={disabled}
>
	<div class="flex flex-1 items-center gap-1">
		{#if keys.length > 0}
			{#each keys as key}
				<kbd
					class="inline-flex h-6 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground"
				>
					{key}
				</kbd>
			{/each}
		{:else}
			<span class="text-muted-foreground">{displayValue}</span>
		{/if}
	</div>

	{#if value && !disabled}
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger class="h-6 w-6 p-0 opacity-70 hover:opacity-100">
					<Button
						variant="ghost"
						size="icon"
						onclick={(e) => {
							e.stopPropagation();
							clearShortcut();
						}}
					>
						<X class="h-4 w-4" />
						<span class="sr-only">Clear</span>
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Clear shortcut</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}

	{#if isRecording}
		<div
			class="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
		>
			<p class="text-sm font-medium">Press any key combination...</p>
			<Button
				variant="ghost"
				size="sm"
				class="absolute right-2 top-1/2 -translate-y-1/2"
				onclick={(e) => {
					e.stopPropagation();
					stopRecording();
				}}
			>
				Cancel
			</Button>
		</div>
	{/if}
</div>
