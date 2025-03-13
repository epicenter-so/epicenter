<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '$lib/utils';
	import { tryAsync } from '@epicenterhq/result';
	import { type Command, WhisperingErr } from '@repo/shared';
	import { XIcon } from 'lucide-svelte';
	import { createKeyRecorder } from './index.svelte';

	const {
		command,
		placeholder,
		autoFocus = false,
	}: {
		command: Command;
		placeholder?: string;
		autoFocus?: boolean;
	} = $props();

	const shortcutsRegister = getShortcutsRegisterFromContext();

	const keyCombination = $derived(
		settings.value[`shortcuts.global.${command.id}`],
	);

	let isPopoverOpen = $state(false);

	const isAppleDevice = /macintosh|mac os x|iphone|ipad|ipod/i.test(
		navigator.userAgent.toLowerCase(),
	);

	// Key mapping for Tauri Global Shortcut
	// https://v2.tauri.app/plugin/global-shortcut/
	const keyMap = {
		// Special keys
		' ': 'Space',
		ArrowUp: 'Up',
		ArrowDown: 'Down',
		ArrowLeft: 'Left',
		ArrowRight: 'Right',
		Escape: 'Escape',
		Enter: 'Return',
		Return: 'Return',
		Backspace: 'Backspace',
		Tab: 'Tab',
		Delete: 'Delete',
		Home: 'Home',
		End: 'End',
		PageUp: 'PageUp',
		PageDown: 'PageDown',
		Insert: 'Insert',
		CapsLock: 'CapsLock',
		Clear: 'Clear',

		// Function keys
		F1: 'F1',
		F2: 'F2',
		F3: 'F3',
		F4: 'F4',
		F5: 'F5',
		F6: 'F6',
		F7: 'F7',
		F8: 'F8',
		F9: 'F9',
		F10: 'F10',
		F11: 'F11',
		F12: 'F12',
		F13: 'F13',
		F14: 'F14',
		F15: 'F15',
		F16: 'F16',
		F17: 'F17',
		F18: 'F18',
		F19: 'F19',

		// Numpad keys
		Numpad0: 'Numpad0',
		Numpad1: 'Numpad1',
		Numpad2: 'Numpad2',
		Numpad3: 'Numpad3',
		Numpad4: 'Numpad4',
		Numpad5: 'Numpad5',
		Numpad6: 'Numpad6',
		Numpad7: 'Numpad7',
		Numpad8: 'Numpad8',
		Numpad9: 'Numpad9',
		NumpadMultiply: 'NumpadMultiply',
		NumpadAdd: 'NumpadAdd',
		NumpadEnter: 'NumpadEnter',
		NumpadSubtract: 'NumpadSubtract',
		NumpadDecimal: 'NumpadDecimal',
		NumpadDivide: 'NumpadDivide',

		// Additional common keys
		Comma: ',',
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
	} satisfies Record<KeyboardEvent['key'], string>;

	const keyRecorder = createKeyRecorder({
		mapKeyboardEventToKeyCombination: (event) => {
			const modifiers: string[] = [];

			// Handle Ctrl/Command as CommandOrControl for cross-platform compatibility
			if (event.ctrlKey || event.metaKey) {
				modifiers.push('CommandOrControl');
			}

			if (event.altKey) modifiers.push('Alt');
			if (event.shiftKey) modifiers.push('Shift');

			const getMainKey = ({ key }: KeyboardEvent) => {
				if (key in keyMap) return keyMap[key as keyof typeof keyMap];
				if (key.length === 1) return key.toUpperCase();
				return key;
			};
			const mainKey = getMainKey(event);

			const isJustModifiers = [
				'CommandOrControl',
				'Control',
				'Command',
				'Alt',
				'Shift',
			].includes(mainKey);
			if (isJustModifiers) return null;

			return [...modifiers, mainKey].join('+');
		},
		handleKeyCombinationRecorded: async (keyCombination) => {
			const result = await shortcutsRegister.registerCommandGlobally({
				command,
				keyCombination,
			});
			if (!result.ok) {
				toast.error(result.error);
			} else {
				settings.value = {
					...settings.value,
					[`shortcuts.global.${command.id}`]: keyCombination,
				};
				toast.success({
					title: `Global shortcut set to ${keyCombination}`,
					description: `Press the shortcut to trigger "${command.title}"`,
				});
			}
			isPopoverOpen = false;
		},
		unregisterOldCommand: async () => {
			const oldShortcutKey = settings.value[`shortcuts.global.${command.id}`];
			if (oldShortcutKey) {
				const unregisterOldShortcutKeyResult = await tryAsync({
					try: async () => {
						if (!window.__TAURI_INTERNALS__) return;
						const { unregister } = await import(
							'@tauri-apps/plugin-global-shortcut'
						);
						return await unregister(oldShortcutKey);
					},
					mapErr: (error) =>
						WhisperingErr({
							title: `Error unregistering command with id ${command.id} globally`,
							description: 'Please try again.',
							action: { type: 'more-details', error },
						}),
				});

				if (!unregisterOldShortcutKeyResult.ok) {
					toast.error(unregisterOldShortcutKeyResult.error);
				}
			}
		},
		clearKeyCombination: async () => {
			settings.value = {
				...settings.value,
				[`shortcuts.global.${command.id}`]: null,
			};
			toast.success({
				title: 'Global shortcut cleared',
				description: `Please set a new shortcut to trigger "${command.title}"`,
			});
			isPopoverOpen = false;
		},
		onEscape: () => {
			isPopoverOpen = false;
		},
	});

	// Helper function to render key symbols
	function renderKeySymbol(key: (typeof keyMap)[keyof typeof keyMap]) {
		const renderKeyMap = {
			CommandOrControl: isAppleDevice ? '⌘' : 'Ctrl',
			Alt: isAppleDevice ? '⌥' : 'Alt',
			Shift: '⇧',
			Space: '␣',
			Up: '↑',
			Down: '↓',
			Left: '←',
			Right: '→',
			Escape: 'Esc',
			Return: '↵',
			Backspace: '⌫',
			Tab: '⇥',
			Delete: '⌦',
			Home: 'Home',
			End: 'End',
			PageUp: 'PgUp',
			PageDown: 'PgDn',
			Insert: 'Ins',
			CapsLock: 'Caps',
			Clear: 'Clear',
			// Function keys
			F1: 'F1',
			F2: 'F2',
			F3: 'F3',
			F4: 'F4',
			F5: 'F5',
			F6: 'F6',
			F7: 'F7',
			F8: 'F8',
			F9: 'F9',
			F10: 'F10',
			F11: 'F11',
			F12: 'F12',
			F13: 'F13',
			F14: 'F14',
			F15: 'F15',
			F16: 'F16',
			F17: 'F17',
			F18: 'F18',
			F19: 'F19',
			// Numpad keys
			Numpad0: '0',
			Numpad1: '1',
			Numpad2: '2',
			Numpad3: '3',
			Numpad4: '4',
			Numpad5: '5',
			Numpad6: '6',
			Numpad7: '7',
			Numpad8: '8',
			Numpad9: '9',
			NumpadMultiply: '×',
			NumpadAdd: '+',
			NumpadEnter: '↵',
			NumpadSubtract: '-',
			NumpadDecimal: '.',
			NumpadDivide: '/',
			// Additional common keys
			',': ',',
			'.': '.',
			';': ';',
			"'": "'",
			'[': '[',
			']': ']',
			'`': '`',
			'\\': '\\',
			'-': '-',
			'=': '=',
			'/': '/',
		} satisfies Record<(typeof keyMap)[keyof typeof keyMap], string>;

		if (key in renderKeyMap) {
			return renderKeyMap[key as keyof typeof renderKeyMap];
		}
		return key;
	}
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
					{renderKeySymbol(key)}
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
					{command.title}
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
										{renderKeySymbol(key)}
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
