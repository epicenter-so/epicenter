import { type Command, commandCallbacks } from '$lib/commands';
import { services } from '$lib/services';
import { Err } from '@epicenterhq/result';
import { WhisperingError } from '@repo/shared';
import { defineMutation } from '../_utils';

export const shortcuts = {
	registerCommandLocally: defineMutation({
		mutationKey: ['shortcuts', 'registerCommandLocally'] as const,
		resultMutationFn: async ({
			command,
			keyCombination,
		}: {
			command: Command;
			keyCombination: string[];
		}) =>
			services.localShortcutManager.register(
				command.id,
				keyCombination,
				commandCallbacks[command.id],
			),
	}),

	unregisterCommandLocally: defineMutation({
		mutationKey: ['shortcuts', 'unregisterCommandLocally'] as const,
		resultMutationFn: async ({ commandId }: { commandId: string }) =>
			services.localShortcutManager.unregister(commandId),
	}),

	registerCommandGlobally: defineMutation({
		mutationKey: ['shortcuts', 'registerCommandGlobally'] as const,
		resultMutationFn: async ({
			command,
			keyCombination,
		}: {
			command: Command;
			keyCombination: string;
		}) => {
			if (!window.__TAURI_INTERNALS__) {
				return Err(
					WhisperingError({
						title: 'Global shortcuts not available',
						description:
							'Global shortcuts are only available in the desktop app.',
						action: {
							type: 'link',
							label: 'Learn more',
							goto: '/desktop-app',
						},
						context: {},
						cause: new Error('Not in Tauri environment'),
					}),
				);
			}

			return await services.globalShortcutManager.register(
				command.id,
				keyCombination,
				commandCallbacks[command.id],
			);
		},
	}),

	unregisterCommandGlobally: defineMutation({
		mutationKey: ['shortcuts', 'unregisterCommandGlobally'] as const,
		resultMutationFn: async ({ commandId }: { commandId: string }) => {
			if (!window.__TAURI_INTERNALS__) {
				return Err(
					WhisperingError({
						title: 'Global shortcuts not available',
						description:
							'Global shortcuts are only available in the desktop app.',
						action: { type: 'link', label: 'Learn more', goto: '/desktop-app' },
						context: {},
						cause: new Error('Not in Tauri environment'),
					}),
				);
			}

			return await services.globalShortcutManager.unregister(commandId);
		},
	}),
};
