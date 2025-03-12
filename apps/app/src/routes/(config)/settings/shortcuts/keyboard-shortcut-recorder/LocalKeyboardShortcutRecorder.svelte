<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import { XIcon } from 'lucide-svelte';
	import { createKeyRecorder } from './index.svelte';

	const {
		title,
		keyCombination,
		onKeyCombinationChange,
		placeholder,
		autoFocus = false,
	}: {
		title: string;
		keyCombination: string;
		onKeyCombinationChange: (keyCombination: string) => void;
		placeholder?: string;
		autoFocus?: boolean;
	} = $props();

	let isPopoverOpen = $state(false);

	const keyRecorder = createKeyRecorder({
		mapKeyboardEventToKeyCombination: (event) => {
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

			const modifiers: string[] = [];
			if (event.ctrlKey) modifiers.push('ctrl');
			if (event.metaKey) modifiers.push('command');
			if (event.altKey) modifiers.push('alt');
			if (event.shiftKey) modifiers.push('shift');

			const getMainKey = ({ key }: KeyboardEvent) => {
				if (key in keyMap) return keyMap[key];
				if (key.length === 1) return key.toLowerCase();
				return key;
			};
			const mainKey = getMainKey(event);

			const isJustModifiers = modifiers.includes(mainKey);
			if (isJustModifiers) return null;

			return [...modifiers, mainKey].join('+');
		},
		onKeyCombinationRecorded: (keyCombination) => {
			onKeyCombinationChange(keyCombination);
			isPopoverOpen = false;
		},
		onEscape: () => {
			isPopoverOpen = false;
		},
	});
</script>

<Popover.Root
	open={isPopoverOpen}
	onOpenChange={(isOpen) => {
		isPopoverOpen = isOpen;
		if (!isOpen) keyRecorder.stopListening();
		if (isOpen && autoFocus) {
			setTimeout(() => {
				keyRecorder.startListening();
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
					{key}
				</kbd>
			{/each}
			<WhisperingButton
				size="icon"
				variant="ghost"
				onclick={(e) => {
					e.stopPropagation();
					keyRecorder.clear();
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
					{title}
				</h4>
				<p class="text-sm text-muted-foreground">Set a keyboard shortcut</p>
			</div>

			<div class="space-y-2">
				<button
					type="button"
					class={cn(
						'relative flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
						keyRecorder.isListening && 'ring-2 ring-ring ring-offset-2',
					)}
					onclick={(e) => {
						e.stopPropagation();
						keyRecorder.startListening();
					}}
					tabindex="0"
					aria-label={keyRecorder.isListening
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
										{key}
									</kbd>
								{/each}
							{:else}
								<span class="text-muted-foreground truncate">
									{placeholder}
								</span>
							{/if}
						</div>
					</div>

					{#if keyRecorder.isListening}
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
