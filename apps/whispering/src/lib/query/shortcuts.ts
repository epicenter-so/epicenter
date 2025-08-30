import type { KeyboardEventSupportedKey } from '$lib/constants/keyboard';
import type { Accelerator } from '$lib/services/global-shortcut-manager';
import type { CommandId } from '$lib/services/local-shortcut-manager';

import { type Command, commandCallbacks } from '$lib/commands';
import { IS_MACOS } from '$lib/constants/platform';
import * as services from '$lib/services';

import { defineMutation } from './_client';

export const shortcuts = {
	registerCommandGlobally: defineMutation({
		mutationKey: ['shortcuts', 'registerCommandGlobally'] as const,
		resultMutationFn: ({
			// Parameter renamed to indicate it may contain legacy "CommandOrControl" syntax
			// Legacy format: "CommandOrControl+Shift+R" → Modern format: "Command+Shift+R" (macOS) or "Control+Shift+R" (Windows/Linux)
			accelerator: legacyAcceleratorString,
			command,
		}: {
			accelerator: Accelerator;
			command: Command;
		}) => {
			// Convert legacy "CommandOrControl" syntax to platform-specific modifiers for backwards compatibility
			// This ensures users with old settings don't need to manually update their shortcuts
			const accelerator = legacyAcceleratorString.replace(
				'CommandOrControl',
				IS_MACOS ? 'Command' : 'Control',
			) as Accelerator;
			return services.globalShortcutManager.register({
				accelerator,
				callback: commandCallbacks[command.id],
				on: command.on,
			});
		},
	}),

	registerCommandLocally: defineMutation({
		mutationKey: ['shortcuts', 'registerCommandLocally'] as const,
		resultMutationFn: ({
			command,
			keyCombination,
		}: {
			command: Command;
			keyCombination: KeyboardEventSupportedKey[];
		}) =>
			services.localShortcutManager.register({
				callback: commandCallbacks[command.id],
				id: command.id as CommandId,
				keyCombination,
				on: command.on,
			}),
	}),

	unregisterCommandGlobally: defineMutation({
		mutationKey: ['shortcuts', 'unregisterCommandGlobally'] as const,
		resultMutationFn: async ({ accelerator }: { accelerator: Accelerator }) => {
			return await services.globalShortcutManager.unregister(accelerator);
		},
	}),

	unregisterCommandLocally: defineMutation({
		mutationKey: ['shortcuts', 'unregisterCommandLocally'] as const,
		resultMutationFn: async ({ commandId }: { commandId: CommandId }) =>
			services.localShortcutManager.unregister(commandId),
	}),
};
