import { type Command, type CommandId, commandCallbacks } from '$lib/commands';
import * as services from '$lib/services';
import type { Accelerator } from '$lib/services/shortcuts/createGlobalShortcutManager';
import type { SupportedKey } from '$lib/keyboard';
import { defineMutation } from '../_utils';

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
			accelerator,
		}: {
			command: Command;
			accelerator: Accelerator;
		}) =>
			services.globalShortcutManager.register({
				id: command.id as CommandId,
				accelerator,
				callback: commandCallbacks[command.id],
				on: command.on,
			}),
	}),

	unregisterCommandGlobally: defineMutation({
		mutationKey: ['shortcuts', 'unregisterCommandGlobally'] as const,
		resultMutationFn: async ({ accelerator }: { accelerator: Accelerator }) => {
			return await services.globalShortcutManager.unregister(accelerator);
		},
	}),
};
