<script lang="ts">
	import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { trySync } from '@epicenterhq/result';
	import type { Command } from '@repo/shared';
	import { WhisperingError } from '@repo/shared';
	import hotkeys from 'hotkeys-js';
	import { createKeyRecorder } from './index.svelte';
	import { createLocalKeyMapper } from './key-mappers';
	import KeyboardShortcutRecorder from './KeyboardShortcutRecorder.svelte';

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
	let isPopoverOpen = $state(false);

	// Get the current key combination from settings
	const keyCombination = $derived(
		settings.value[`shortcuts.local.${command.id}`],
	);

	// Create a key mapper for local shortcuts
	const keyMapper = createLocalKeyMapper();

	// Create the key recorder with callbacks
	const keyRecorder = createKeyRecorder(
		{
			onUnregister: () => {
				const currentCommandKey =
					settings.value[`shortcuts.local.${command.id}`];
				if (!currentCommandKey) return;

				const { error: unregisterError } = trySync({
					try: () => hotkeys.unbind(currentCommandKey),
					mapErr: (error) =>
						WhisperingError({
							title: `Error unregistering old command with id ${command.id} locally`,
							description: 'Please try again.',
							action: { type: 'more-details', error },
						}),
				});

				if (unregisterError) {
					toast.error(unregisterError);
				}
			},
			onRegister: (keyCombination) => {
				const { error: registerError } =
					shortcutsRegister.registerCommandLocally({
						command,
						keyCombination,
					});

				if (registerError) {
					toast.error(registerError);
					return;
				}

				settings.value = {
					...settings.value,
					[`shortcuts.local.${command.id}`]: keyCombination,
				};

				toast.success({
					title: `Local shortcut set to ${keyCombination}`,
					description: `Press the shortcut to trigger "${command.title}"`,
				});

				isPopoverOpen = false;
			},
			onClear: () => {
				settings.value = {
					...settings.value,
					[`shortcuts.local.${command.id}`]: null,
				};

				toast.success({
					title: 'Local shortcut cleared',
					description: `Please set a new shortcut to trigger "${command.title}"`,
				});

				isPopoverOpen = false;
			},
			onEscape: () => {
				isPopoverOpen = false;
			},
		},
		{ mapKeyboardEvent: keyMapper.mapKeyboardEvent },
	);

	// Handle popover open/close
	function handleOpenChange(isOpen: boolean) {
		isPopoverOpen = isOpen;
		if (!isOpen) keyRecorder.stop();
	}
</script>

<KeyboardShortcutRecorder
	{command}
	{placeholder}
	{autoFocus}
	{keyCombination}
	isListening={keyRecorder.isListening}
	onOpenChange={handleOpenChange}
	onStartListening={() => keyRecorder.start()}
	onClear={() => keyRecorder.clear()}
/>
