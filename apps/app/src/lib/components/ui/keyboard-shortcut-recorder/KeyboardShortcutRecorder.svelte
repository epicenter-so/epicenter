<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils';
	import { X } from 'lucide-svelte';
	import { onMount } from 'svelte';

	const {
		value = '',
		placeholder = 'Click to record shortcut',
		onValueChange,
		onEscape = () => {},
		className = '',
		autoFocus = false,
	}: {
		value: string;
		placeholder?: string;
		onValueChange: (value: string) => void;
		onEscape?: () => void;
		className?: string;
		autoFocus?: boolean;
	} = $props();

	let isRecording = $state(false);
	/** Internal state keeping track of the keys pressed as an array */
	let keys = $state<string[]>([]);

	// Derived values
	const displayValue = $derived(value ?? placeholder);

	// Key mapping for hotkeys-js, from https://github.com/jaywcjlove/hotkeys-js
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

	function clearShortcut(e?: MouseEvent) {
		if (e) {
			e.stopPropagation();
		}
		keys = [];
		onValueChange('');
		stopRecording();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!isRecording) return;

		event.preventDefault();
		event.stopPropagation();

		if (event.key === 'Escape') {
			stopRecording();
			onEscape();
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
		onValueChange(shortcutValue);

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
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<button
	class={cn(
		'relative flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all',
		isRecording && 'ring-2 ring-ring ring-offset-2',
		className,
	)}
	onclick={startRecording}
	tabindex="0"
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

	{#if value}
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger class="inline-flex">
					<Button
						variant="ghost"
						size="icon"
						class="h-6 w-6 p-0 opacity-70 hover:opacity-100"
						onclick={clearShortcut}
					>
						<X class="h-4 w-4" />
						<span class="sr-only">Clear</span>
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content side="top">
					<p>Clear shortcut</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}

	{#if isRecording}
		<div
			class="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md border border-input animate-in fade-in-0 zoom-in-95"
		>
			<div class="flex flex-col items-center gap-1">
				<p class="text-sm font-medium">Press key combination</p>
				<p class="text-xs text-muted-foreground">Esc to cancel</p>
			</div>
			<Button
				variant="ghost"
				size="sm"
				class="absolute right-2 top-1/2 -translate-y-1/2"
				onclick={(e) => {
					e.stopPropagation();
					stopRecording();
					onEscape();
				}}
			>
				Cancel
			</Button>
		</div>
	{/if}
</button>
