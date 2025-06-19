import { type Command, commandCallbacks } from '$lib/commands';
import { services } from '$lib/services';
import { defineMutation } from '../_utils';

export const shortcuts = {
	registerCommandLocally: defineMutation({
		mutationKey: ['shortcuts', 'registerCommandLocally'] as const,
		resultMutationFn: ({
			command,
			keyCombination,
		}: {
			command: Command;
			keyCombination: string[];
		}) =>
			services.localShortcutManager.register({
				id: command.id,
				keyCombination,
				callback: commandCallbacks[command.id],
			}),
	}),

	unregisterCommandLocally: defineMutation({
		mutationKey: ['shortcuts', 'unregisterCommandLocally'] as const,
		resultMutationFn: async ({ commandId }: { commandId: string }) =>
			services.localShortcutManager.unregister(commandId),
	}),

	registerCommandGlobally: defineMutation({
		mutationKey: ['shortcuts', 'registerCommandGlobally'] as const,
		resultMutationFn: ({
			command,
			keyCombination,
		}: {
			command: Command;
			keyCombination: string;
		}) =>
			services.globalShortcutManager.register(
				command.id,
				keyCombination,
				commandCallbacks[command.id],
			),
	}),

	unregisterCommandGlobally: defineMutation({
		mutationKey: ['shortcuts', 'unregisterCommandGlobally'] as const,
		resultMutationFn: ({ commandId }: { commandId: string }) =>
			services.globalShortcutManager.unregister(commandId),
	}),
};
