import { type Command, commandCallbacks, type CommandId } from '$lib/commands';
import { services } from '$lib/services';
import { defineMutation } from '../_utils';
import type { Accelerator } from '$lib/services/shortcuts/createGlobalShortcutManager';
import type { SupportedKey } from '$lib/services/shortcuts/createLocalShortcutManager';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from '@epicenterhq/result';

export const shortcuts = {
	registerCommandLocally: defineMutation({
		mutationKey: ['shortcuts', 'registerCommandLocally'] as const,
		resultMutationFn: ({
			command,
			keyCombination,
		}: {
			command: Command;
			keyCombination: SupportedKey[];
		}) =>
			services.localShortcutManager.register({
				id: command.id as CommandId,
				keyCombination,
				callback: commandCallbacks[command.id],
				on: command.on,
			}),
	}),

	unregisterCommandLocally: defineMutation({
		mutationKey: ['shortcuts', 'unregisterCommandLocally'] as const,
		resultMutationFn: async ({ commandId }: { commandId: CommandId }) =>
			services.localShortcutManager.unregister(commandId),
	}),

	registerCommandGlobally: defineMutation({
		mutationKey: ['shortcuts', 'registerCommandGlobally'] as const,
		resultMutationFn: ({
			command,
			keyCombination,
		}: {
			command: Command;
			keyCombination: Accelerator;
		}) =>
			services.globalShortcutManager.register({
				id: command.id as CommandId,
				accelerator: keyCombination,
				callback: commandCallbacks[command.id],
				on: command.on,
			}),
	}),

	unregisterCommandGlobally: defineMutation({
		mutationKey: ['shortcuts', 'unregisterCommandGlobally'] as const,
		resultMutationFn: async ({ commandId }: { commandId: CommandId }) => {
			const accelerator = settings.value[`shortcuts.global.${commandId}`];
			if (!accelerator) return Ok(undefined);
			return await services.globalShortcutManager.unregister(
				accelerator as Accelerator,
			);
		},
	}),
};
