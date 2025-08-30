<script lang="ts">
	import type { Command } from '$lib/commands';
	import type { KeyboardEventSupportedKey } from '$lib/constants/keyboard';

	import { rpc } from '$lib/query';
	import { fromTaggedError } from '$lib/result';
	import {
		type Accelerator,
		pressedKeysToTauriAccelerator,
	} from '$lib/services/global-shortcut-manager';
	import { settings } from '$lib/stores/settings.svelte';
	import { type PressedKeys } from '$lib/utils/createPressedKeys.svelte';

	import { createKeyRecorder } from './create-key-recorder.svelte';
	import KeyboardShortcutRecorder from './KeyboardShortcutRecorder.svelte';

	const {
		autoFocus = true,
		command,
		placeholder,
		pressedKeys,
	}: {
		autoFocus?: boolean;
		command: Command;
		placeholder?: string;
		pressedKeys: PressedKeys;
	} = $props();

	const shortcutValue = $derived(
		settings.value[`shortcuts.global.${command.id}`],
	);

	const keyRecorder = createKeyRecorder({
		onClear: async () => {
			const { error: unregisterError } =
				await rpc.shortcuts.unregisterCommandGlobally.execute({
					accelerator: shortcutValue as Accelerator,
				});

			if (unregisterError) {
				rpc.notify.error.execute(
					fromTaggedError(unregisterError, {
						title: 'Error clearing global shortcut',
					}),
				);
			}

			settings.updateKey(`shortcuts.global.${command.id}`, null);

			rpc.notify.success.execute({
				title: 'Global shortcut cleared',
				description: `Please set a new shortcut to trigger "${command.title}"`,
			});
		},
		onRegister: async (keyCombination: KeyboardEventSupportedKey[]) => {
			if (shortcutValue) {
				const { error: unregisterError } =
					await rpc.shortcuts.unregisterCommandGlobally.execute({
						accelerator: shortcutValue as Accelerator,
					});

				if (unregisterError) {
					rpc.notify.error.execute({
						title: 'Failed to unregister shortcut',
						description:
							'Could not unregister the global shortcut. It may already be in use by another application.',
						action: { error: unregisterError, type: 'more-details' },
					});
				}
			}

			const { data: accelerator, error: acceleratorError } =
				pressedKeysToTauriAccelerator(keyCombination);

			if (acceleratorError) {
				rpc.notify.error.execute({
					title: 'Invalid shortcut combination',
					description: `The key combination "${keyCombination.join('+')}" is not valid. Please try a different combination.`,
					action: { error: acceleratorError, type: 'more-details' },
				});
				return;
			}

			const { error: registerError } =
				await rpc.shortcuts.registerCommandGlobally.execute({
					accelerator,
					command,
				});

			if (registerError) {
				switch (registerError.name) {
					case 'InvalidAcceleratorError':
						rpc.notify.error.execute({
							title: 'Invalid shortcut combination',
							description: `The key combination "${keyCombination.join('+')}" is not valid. Please try a different combination.`,
							action: { error: registerError, type: 'more-details' },
						});
						break;
					default:
						rpc.notify.error.execute({
							title: 'Failed to register shortcut',
							description:
								'Could not register the global shortcut. It may already be in use by another application.',
							action: { error: registerError, type: 'more-details' },
						});
						break;
				}
				return;
			}

			settings.updateKey(`shortcuts.global.${command.id}`, accelerator);

			rpc.notify.success.execute({
				title: `Global shortcut set to ${accelerator}`,
				description: `Press the shortcut to trigger "${command.title}"`,
			});
		},
		pressedKeys,
	});
</script>

<KeyboardShortcutRecorder
	title={command.title}
	{placeholder}
	{autoFocus}
	rawKeyCombination={shortcutValue}
	{keyRecorder}
/>
