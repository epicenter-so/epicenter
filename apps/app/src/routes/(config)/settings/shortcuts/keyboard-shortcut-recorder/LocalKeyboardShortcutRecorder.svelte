<script lang="ts">
	import type { Command } from '$lib/commands';
	import { rpc } from '$lib/query';
	import { settings } from '$lib/stores/settings.svelte';
	import { toast } from '$lib/toast';
	import KeyboardShortcutRecorder from './KeyboardShortcutRecorder.svelte';
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

	let isPopoverOpen = $state(false);

	// Get the current key combination from settings
	const keyCombination = $derived(
		settings.value[`shortcuts.local.${command.id}`],
	);

	// Create the key recorder with callbacks
	const keyRecorder = createKeyRecorder({
		onUnregister: async () => {
			const currentCommandKey = settings.value[`shortcuts.local.${command.id}`];
			if (!currentCommandKey) return;

			const { error: unregisterError } =
				await rpc.shortcuts.unregisterCommandLocally.execute({
					commandId: command.id,
				});

			if (unregisterError) {
				toast.error(unregisterError);
			}
		},
		onRegister: async (keyCombination) => {
			const { error: registerError } =
				await rpc.shortcuts.registerCommandLocally.execute({
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
