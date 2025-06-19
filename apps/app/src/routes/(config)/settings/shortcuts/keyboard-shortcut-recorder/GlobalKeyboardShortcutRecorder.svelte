<script lang="ts">
	import { toast } from '$lib/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import type { Command } from '$lib/commands';
	import KeyboardShortcutRecorder from './KeyboardShortcutRecorder.svelte';
	import { createKeyRecorder } from './index.svelte';
	import { rpc } from '$lib/query';
	import {
		arrayToShortcutString,
		shortcutStringToTauriAccelerator,
	} from '$lib/services/shortcuts';

	const {
		command,
		placeholder,
		autoFocus = false,
	}: {
		command: Command;
		placeholder?: string;
		autoFocus?: boolean;
	} = $props();

	let isPopoverOpen = $state(false);

	// Get the current key combination from settings
	const keyCombination = $derived(
		settings.value[`shortcuts.global.${command.id}`],
	);

	// Create the key recorder with callbacks
	const keyRecorder = createKeyRecorder({
		onUnregister: async () => {
			const oldShortcutKey = settings.value[`shortcuts.global.${command.id}`];
			if (!oldShortcutKey) return;

			const { error: unregisterError } =
				await rpc.shortcuts.unregisterCommandGlobally.execute({
					commandId: command.id,
				});

			if (unregisterError) {
				toast.error(unregisterError);
			}
		},
		onRegister: async (keyCombination) => {
			// Convert the local format to Tauri accelerator format
			const accelerator = shortcutStringToTauriAccelerator(
				arrayToShortcutString(keyCombination),
			);

			const { error: registerError } =
				await rpc.shortcuts.registerCommandGlobally.execute({
					command,
					keyCombination: accelerator,
				});

			if (registerError) {
				toast.error(registerError);
				return;
			}

			settings.value = {
				...settings.value,
				[`shortcuts.global.${command.id}`]: accelerator,
			};

			toast.success({
				title: `Global shortcut set to ${accelerator}`,
				description: `Press the shortcut to trigger "${command.title}"`,
			});

			isPopoverOpen = false;
		},
		onClear: async () => {
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
	onManualSet={async (keyCombination) => {
		// First unregister the old shortcut
		await keyRecorder.callbacks.onUnregister();
		// Then register the new one
		await keyRecorder.callbacks.onRegister(keyCombination);
	}}
/>
