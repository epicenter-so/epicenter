<script lang="ts">
	import type { Command } from '$lib/commands';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import { Keyboard, Pencil, XIcon } from 'lucide-svelte';

	const {
		command,
		placeholder = 'Press a key combination',
		autoFocus = false,
		keyCombination,
		isListening,
		onOpenChange,
		onStartListening,
		onClear,
		onManualSet,
	}: {
		command: Command;
		placeholder?: string;
		autoFocus?: boolean;
		keyCombination: string | null;
		isListening: boolean;
		onOpenChange: (isOpen: boolean) => void;
		onStartListening: () => void;
		onClear: () => void;
		onManualSet?: (keyCombination: string[]) => void;
	} = $props();

	let isPopoverOpen = $state(false);
	let isManualMode = $state(false);
	let manualValue = $state(keyCombination ?? '');

	$effect(() => {
		manualValue = keyCombination ?? '';
	});

	/**
	 * Renders a key symbol with platform-specific symbols
	 */
	function renderKeySymbol(key: string): string {
		const isAppleDevice = /macintosh|mac os x|iphone|ipad|ipod/i.test(
			navigator.userAgent.toLowerCase(),
		);

		const symbolMap: Record<string, string> = {
			// Modifier keys
			ctrl: isAppleDevice ? '⌃' : 'Ctrl',
			CommandOrControl: isAppleDevice ? '⌘' : 'Ctrl',
			command: '⌘',
			alt: isAppleDevice ? '⌥' : 'Alt',
			Alt: isAppleDevice ? '⌥' : 'Alt',
			shift: '⇧',
			Shift: '⇧',

			// Special keys
			space: '␣',
			Space: '␣',
			up: '↑',
			Up: '↑',
			down: '↓',
			Down: '↓',
			left: '←',
			Left: '←',
			right: '→',
			Right: '→',
			esc: 'Esc',
			Escape: 'Esc',
			enter: '↵',
			Return: '↵',
			return: '↵',
			backspace: '⌫',
			Backspace: '⌫',
			tab: '⇥',
			Tab: '⇥',
			delete: '⌦',
			Delete: '⌦',

			// Navigation keys
			home: 'Home',
			Home: 'Home',
			end: 'End',
			End: 'End',
			pageup: 'PgUp',
			PageUp: 'PgUp',
			pagedown: 'PgDn',
			PageDown: 'PgDn',

			// Other special keys
			insert: 'Ins',
			Insert: 'Ins',
			capslock: 'Caps',
			CapsLock: 'Caps',
			clear: 'Clear',
			Clear: 'Clear',
		};

		// Handle function keys
		if (/^f\d+$/i.test(key)) {
			return key.toUpperCase();
		}

		// Handle numpad keys
		if (key.startsWith('num_') || key.startsWith('Numpad')) {
			const numKey = key.replace(/^(num_|Numpad)/, '');

			const numpadSymbols: Record<string, string> = {
				multiply: '×',
				add: '+',
				enter: '↵',
				subtract: '-',
				decimal: '.',
				divide: '/',
			};

			return numpadSymbols[numKey] ?? numKey;
		}

		return symbolMap[key] ?? key;
	}
</script>

<Popover.Root
	open={isPopoverOpen}
	onOpenChange={(isOpen) => {
		isPopoverOpen = isOpen;
		onOpenChange(isOpen);
		if (!isOpen) {
			isManualMode = false;
		}
		if (isOpen && autoFocus && !isManualMode) {
			setTimeout(() => onStartListening(), 100);
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

	<Popover.Content class="w-80" align="end">
		<div class="space-y-4">
			<div>
				<h4 class="mb-1 text-sm font-medium leading-none">{command.title}</h4>
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
					<div class="flex w-full items-center justify-between">
						<div
							class="flex flex-grow items-center gap-1.5 overflow-x-auto pr-2 scrollbar-none"
						>
							{#if keyCombination && !isListening}
								{#each keyCombination.split('+') as key}
									<kbd
										class="inline-flex h-6 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground"
									>
										{renderKeySymbol(key)}
									</kbd>
								{/each}
							{:else if !isListening}
								<span class="truncate text-muted-foreground">{placeholder}</span
								>
							{/if}
						</div>
						{#if !isListening}
							<Keyboard class="size-4 text-muted-foreground" />
						{/if}
					</div>

					{#if isListening}
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
							onclick={() => onClear()}
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
						if (manualValue.trim() && onSetManualCombination) {
							onSetManualCombination(manualValue.trim().split('+'));
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
