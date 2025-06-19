import { type Command, commandCallbacks } from '$lib/commands';
import { Err } from '@epicenterhq/result';
import { WhisperingError } from '@repo/shared';
import { defineMutation } from '../_utils';
import { context } from '$lib/context';

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
			context().localShortcutManager.register(
				command.id,
				keyCombination,
				commandCallbacks[command.id],
			),
	}),

	unregisterCommandLocally: defineMutation({
		mutationKey: ['shortcuts', 'unregisterCommandLocally'] as const,
		resultMutationFn: async ({ commandId }: { commandId: string }) =>
			context().localShortcutManager.unregister(commandId),
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

			const { globalShortcutManager } = await import('../index');

			return await globalShortcutManager.register(
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

			const { globalShortcutManager } = await import('../index');

			return await globalShortcutManager.unregister(commandId);
		},
	}),
};
