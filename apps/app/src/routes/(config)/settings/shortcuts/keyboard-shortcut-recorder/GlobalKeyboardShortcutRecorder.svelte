<script lang="ts">
	import type { Command, CommandId } from '$lib/commands';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { rpc } from '$lib/query';
	import { pressedKeysToTauriAccelerator } from '$lib/services/shortcuts/createGlobalShortcutManager';
	import type { SupportedKey } from '$lib/services/shortcuts/createLocalShortcutManager';
	import { settings } from '$lib/stores/settings.svelte';
	import { toast } from '$lib/toast';
	import { type PressedKeys } from '$lib/utils/createPressedKeys.svelte';
	import { X } from 'lucide-svelte';
	import KeyboardShortcutRecorder from './KeyboardShortcutRecorder.svelte';
	import { createKeyRecorder } from './create-key-recorder.svelte';

	const {
		command,
		placeholder,
		autoFocus = true,
		pressedKeys,
		shortcutValue,
	}: {
		command: Command;
		placeholder?: string;
		autoFocus?: boolean;
		pressedKeys: PressedKeys;
		shortcutValue: string | null;
	} = $props();

	const keyRecorder = createKeyRecorder({
		pressedKeys,
		onRegister: async (keyCombination: SupportedKey[]) => {
			const { error: unregisterError } =
				await rpc.shortcuts.unregisterCommandGlobally.execute({
					commandId: command.id as CommandId,
				});

			if (unregisterError) {
				toast.error({
					title: 'Failed to unregister shortcut',
					description:
						'Could not unregister the global shortcut. It may already be in use by another application.',
					action: { type: 'more-details', error: unregisterError },
				});
			}
			const { data: accelerator, error: acceleratorError } =
				pressedKeysToTauriAccelerator(keyCombination);

			if (acceleratorError) {
				toast.error({
					title: 'Invalid shortcut combination',
					description: `The key combination "${keyCombination.join('+')}" is not valid. Please try a different combination.`,
					action: { type: 'more-details', error: acceleratorError },
				});
				return;
			}

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
					commandId: command.id as CommandId,
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

<div class="flex items-center justify-end gap-2">
	{#if shortcutValue}
		<Badge variant="secondary" class="font-mono text-xs max-w-[120px] truncate">
			{shortcutValue}
		</Badge>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={() => keyRecorder.clear()}
		>
			<X class="size-4" />
			<span class="sr-only">Clear shortcut</span>
		</Button>
	{:else}
		<span class="text-sm text-muted-foreground">Not set</span>
	{/if}

	<KeyboardShortcutRecorder
		title={command.title}
		{placeholder}
		{autoFocus}
		rawKeyCombination={shortcutValue}
		{keyRecorder}
	/>
</div>
