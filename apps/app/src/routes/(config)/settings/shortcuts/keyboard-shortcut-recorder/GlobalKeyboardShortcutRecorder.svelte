<script lang="ts">
	import type { Command } from '$lib/commands';
	import { rpc } from '$lib/query';
	import { pressedKeysToTauriAccelerator } from '$lib/services/shortcuts/createGlobalShortcutManager';
	import { settings } from '$lib/stores/settings.svelte';
	import { toast } from '$lib/toast';
	import { createPressedKeys } from '$lib/utils/createPressedKeys.svelte';
	import KeyboardShortcutRecorder from './KeyboardShortcutRecorder.svelte';
	import { createKeyRecorder } from './utils';

	const {
		command,
		placeholder,
		autoFocus = true,
	}: {
		command: Command;
		placeholder?: string;
		autoFocus?: boolean;
	} = $props();

	const pressedKeys = createPressedKeys();

	const keyRecorder = createKeyRecorder({
		pressedKeys,
		onRegister: async (keyCombination) => {
			const { error: unregisterError } =
				await rpc.shortcuts.unregisterCommandGlobally.execute({
					commandId: command.id,
				});

			if (unregisterError) {
				toast.error({
					title: 'Failed to unregister shortcut',
					description:
						'Could not unregister the global shortcut. It may already be in use by another application.',
					action: { type: 'more-details', error: unregisterError },
				});
			}
			const accelerator = pressedKeysToTauriAccelerator(keyCombination);

			const { error: registerError } =
				await rpc.shortcuts.registerCommandGlobally.execute({
					command,
					keyCombination: accelerator,
				});

			if (registerError) {
				switch (registerError.name) {
					case 'InvalidAcceleratorError':
						toast.error({
							title: 'Invalid shortcut combination',
							description: `The key combination "${keyCombination.join('+')}" is not valid. Please try a different combination.`,
							action: { type: 'more-details', error: registerError },
						});
						break;
					default:
						toast.error({
							title: 'Failed to register shortcut',
							description:
								'Could not register the global shortcut. It may already be in use by another application.',
							action: { type: 'more-details', error: registerError },
						});
						break;
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
		},
		onClear: async () => {
			const { error: unregisterError } =
				await rpc.shortcuts.unregisterCommandGlobally.execute({
					commandId: command.id,
				});

			if (unregisterError) {
				toast.error({
					title: 'Error clearing global shortcut',
					description: unregisterError.message,
					action: { type: 'more-details', error: unregisterError },
				});
			}

			settings.value = {
				...settings.value,
				[`shortcuts.global.${command.id}`]: null,
			};

			toast.success({
				title: 'Global shortcut cleared',
				description: `Please set a new shortcut to trigger "${command.title}"`,
			});
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
		if (!isOpen) keyRecorder.stop();
	}}
	onStartListening={() => keyRecorder.start()}
	onClear={() => keyRecorder.clear()}
	onSetManualCombination={async (keyCombination) => {
		await keyRecorder.register(keyCombination);
	}}
/>
