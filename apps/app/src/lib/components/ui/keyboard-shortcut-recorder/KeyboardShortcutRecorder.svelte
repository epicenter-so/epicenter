<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils';
	import { X } from 'lucide-svelte';
	import { onMount } from 'svelte';

	const {
		title,
		value = '',
		placeholder = 'Click to record shortcut',
		className = '',
		autoFocus = false,
		registerShortcutKey,
	}: {
		title: string;
		value: string;
		placeholder?: string;
		className?: string;
		autoFocus?: boolean;
		registerShortcutKey: (shortcutKey: string) => void;
	} = $props();

	let isRecording = $state(false);

	/** Internal state keeping track of the keys pressed as an array */
	let keys = $state<string[]>([]);

	let isPopoverOpen = $state(false);

	const shortcutKey = $derived(keys.join('+'));

	// Derived values
	const displayValue = $derived(value ?? placeholder);

	// Key mapping for hotkeys-js, from https://github.com/jaywcjlove/hotkeys-js/
	const keyMap: Record<string, string> = {
		// Modifier keys
		Control: 'ctrl',
		Meta: 'command',
		Alt: 'alt',
		Shift: 'shift',

		// Special keys
		' ': 'space',
		ArrowUp: 'up',
		ArrowDown: 'down',
		ArrowLeft: 'left',
		ArrowRight: 'right',
		Escape: 'esc',
		Enter: 'enter',
		Return: 'return',
		Backspace: 'backspace',
		Tab: 'tab',
		Delete: 'delete',
		Home: 'home',
		End: 'end',
		PageUp: 'pageup',
		PageDown: 'pagedown',
		Insert: 'insert',
		CapsLock: 'capslock',
		Clear: 'clear',

		// Function keys
		F1: 'f1',
		F2: 'f2',
		F3: 'f3',
		F4: 'f4',
		F5: 'f5',
		F6: 'f6',
		F7: 'f7',
		F8: 'f8',
		F9: 'f9',
		F10: 'f10',
		F11: 'f11',
		F12: 'f12',
		F13: 'f13',
		F14: 'f14',
		F15: 'f15',
		F16: 'f16',
		F17: 'f17',
		F18: 'f18',
		F19: 'f19',

		// Numpad keys
		Numpad0: 'num_0',
		Numpad1: 'num_1',
		Numpad2: 'num_2',
		Numpad3: 'num_3',
		Numpad4: 'num_4',
		Numpad5: 'num_5',
		Numpad6: 'num_6',
		Numpad7: 'num_7',
		Numpad8: 'num_8',
		Numpad9: 'num_9',
		NumpadMultiply: 'num_multiply',
		NumpadAdd: 'num_add',
		NumpadEnter: 'num_enter',
		NumpadSubtract: 'num_subtract',
		NumpadDecimal: 'num_decimal',
		NumpadDivide: 'num_divide',

		// Additional common keys
		Comma: 'comma',
		Period: '.',
		Semicolon: ';',
		Quote: "'",
		BracketLeft: '[',
		BracketRight: ']',
		Backquote: '`',
		Backslash: '\\',
		Minus: '-',
		Equal: '=',
		Slash: '/',
	};

	// Update keys when value changes
	$effect(() => {
		if (value) {
			keys = value.split('+');
		} else {
			keys = [];
		}
	});

	// Auto-focus effect
	onMount(() => {
		if (autoFocus) {
			setTimeout(() => {
				startRecording();
			}, 100); // Small delay to ensure the component is fully mounted
		}
	});

	// Event handlers
	function startRecording() {
		isRecording = true;
		keys = [];
	}

	function stopRecording() {
		isRecording = false;
	}

	function clearShortcut(e: MouseEvent) {
		e.stopPropagation();
		keys = [];
		registerShortcutKey('');
		stopRecording();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!isRecording) return;

		event.preventDefault();
		event.stopPropagation();

		if (event.key === 'Escape') {
			stopRecording();
			isPopoverOpen = false;
			return;
		}

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

		// Skip if the key is a modifier key that's already included
		if (modifiers.includes(mainKey)) {
			return;
		}

		// Build the final key combination
		const newKeys = [...modifiers, mainKey];
		keys = newKeys;

		// Update the value
		const shortcutValue = newKeys.join('+');
		registerShortcutKey(shortcutValue);

		// Stop recording after a valid combination is entered
		stopRecording();
	}

	function handleKeyUp(event: KeyboardEvent) {
		// This helps with cases where the user releases a key before pressing another
		if (
			isRecording &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.altKey &&
			!event.shiftKey
		) {
			// If all modifier keys are released and we haven't captured a main key yet,
			// keep the recording state active
			if (keys.length === 0) {
				return;
			}
		}
	}

	function handleCancelClick(e: MouseEvent) {
		e.stopPropagation();
		stopRecording();
		isPopoverOpen = false;
	}
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<Popover.Root bind:open={isPopoverOpen}>
	<Popover.Trigger
		class="inline-flex items-center gap-1 hover:bg-muted rounded px-2 py-1"
	>
		{#if shortcutKey}
			{#each shortcutKey.split('+') as key}
				<kbd
					class="inline-flex h-6 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground"
				>
					{key}
				</kbd>
			{/each}
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
					{title}
				</h4>
				<p class="text-sm text-muted-foreground">Set a keyboard shortcut</p>
			</div>

			<div class="space-y-2">
				<button
					type="button"
					class={cn(
						'relative flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
						isRecording && 'ring-2 ring-ring ring-offset-2',
						className,
					)}
					onclick={startRecording}
					tabindex="0"
					aria-label={isRecording
						? 'Recording keyboard shortcut'
						: 'Click to record keyboard shortcut'}
				>
					<div class="flex flex-1 items-center justify-between">
						<div
							class="flex items-center gap-1.5 overflow-x-auto scrollbar-none pr-2 flex-grow"
						>
							{#if keys.length > 0}
								{#each keys as key}
									<kbd
										class="inline-flex h-6 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground"
									>
										{key}
									</kbd>
								{/each}
							{:else}
								<span class="text-muted-foreground truncate"
									>{displayValue}</span
								>
							{/if}
						</div>

						{#if keys.length > 0}
							<Tooltip.Provider>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<button
											type="button"
											class="h-6 w-6 p-0 opacity-70 hover:opacity-100 flex-shrink-0 inline-flex items-center justify-center rounded-sm hover:bg-muted"
											onclick={(e) => clearShortcut(e)}
											aria-label="Clear shortcut"
										>
											<X class="h-4 w-4" />
										</button>
									</Tooltip.Trigger>
									<Tooltip.Content side="top" class="z-50">
										<p>Clear shortcut</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/if}
					</div>

					{#if isRecording}
						<div
							class="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md border border-input animate-in fade-in-0 zoom-in-95 z-10"
							aria-live="polite"
						>
							<div class="flex flex-col items-center gap-1 px-4 py-2">
								<p class="text-sm font-medium">Press key combination</p>
								<p class="text-xs text-muted-foreground">Esc to cancel</p>
							</div>
							<Button
								variant="ghost"
								size="sm"
								class="absolute right-2 top-1/2 -translate-y-1/2"
								onclick={(e) => handleCancelClick(e)}
								aria-label="Cancel recording"
							>
								Cancel
							</Button>
						</div>
					{/if}
				</button>
				<Button
					variant="outline"
					class="w-full"
					onclick={() => {
						registerShortcutKey('');
					}}
				>
					Clear
				</Button>
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
