<script lang="ts">
	import type { Command } from '$lib/commands';
	import { rpc } from '$lib/query';
	import { pressedKeysToTauriAccelerator } from '$lib/services/shortcuts';
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
			try {
				// Convert pressed keys directly to Tauri accelerator format
				const accelerator = pressedKeysToTauriAccelerator(keyCombination);

				const { error: registerError } =
					await rpc.shortcuts.registerCommandGlobally.execute({
						command,
						keyCombination: accelerator,
					});

				if (registerError) {
					// Provide specific error messages based on error type
					if (registerError.message?.includes('Invalid accelerator format')) {
						toast.error({
							title: 'Invalid shortcut combination',
							description: `The key combination "${keyCombination.join('+')}" is not valid. Please try a different combination.`,
							action: { type: 'more-details', error: registerError },
						});
					} else {
						toast.error({
							title: 'Failed to register shortcut',
							description:
								'Could not register the global shortcut. It may already be in use by another application.',
							action: { type: 'more-details', error: registerError },
						});
					}
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
			} catch (conversionError) {
				// Handle conversion errors
				toast.error({
					title: 'Invalid key combination',
					description: `Unable to convert "${keyCombination.join('+')}" to a valid shortcut format.`,
					action: {
						type: 'more-details',
						error: {
							message:
								conversionError instanceof Error
									? conversionError.message
									: String(conversionError),
							name: 'ConversionError',
						},
					},
				});
			}
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
</script>

<KeyboardShortcutRecorder
	{command}
	{placeholder}
	{autoFocus}
	keyCombination={settings.value[`shortcuts.global.${command.id}`]}
	isListening={keyRecorder.isListening}
	onOpenChange={(isOpen) => {
		isPopoverOpen = isOpen;
		if (!isOpen) keyRecorder.stop();
	}}
	onStartListening={() => keyRecorder.start()}
	onClear={() => keyRecorder.clear()}
	onSetManualCombination={async (keyCombination) => {
		// First unregister the old shortcut
		await keyRecorder.callbacks.onUnregister();
		// Then register the new one
		await keyRecorder.callbacks.onRegister(keyCombination);
	}}
/>
