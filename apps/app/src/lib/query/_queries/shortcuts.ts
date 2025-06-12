import { type Command, commandCallbacks } from '$lib/commands';
import { tryAsync, trySync } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import hotkeys from 'hotkeys-js';
import { defineMutation } from '../_utils';

export const shortcuts = {
	registerCommandLocally: defineMutation({
		mutationKey: ['shortcuts', 'registerCommandLocally'] as const,
		resultMutationFn: async ({
			command,
			keyCombination,
		}: {
			command: Command;
			keyCombination: string;
		}) => {
			if (command.id === 'pushToTalk') {
				const registerPushToTalkLocallyResult = trySync({
					try: () => {
						let isKeyPressed = false;
						hotkeys(keyCombination, { keydown: true, keyup: true }, (event) => {
							// Prevent the default refresh event under WINDOWS system
							event.preventDefault();
							if (event.type === 'keydown' && !isKeyPressed) {
								isKeyPressed = true;
								commandCallbacks.pushToTalk();
							} else if (event.type === 'keyup') {
								isKeyPressed = false;
								commandCallbacks.pushToTalk();
							}

							return false;
						});
					},
					mapError: (error): WhisperingError => ({
						name: 'WhisperingError',
						title: 'Error registering push to talk local shortcut',
						description: 'Please make sure it is a valid keyboard shortcut.',
						action: { type: 'more-details', error },
						context: {},
						cause: error,
					}),
				});
				return registerPushToTalkLocallyResult;
			}
			const registerNewCommandLocallyResult = trySync({
				try: () =>
					hotkeys(keyCombination, (event) => {
						// Prevent the default refresh event under WINDOWS system
						event.preventDefault();
						commandCallbacks[command.id]();
						return false;
					}),
				mapError: (error): WhisperingError => ({
					name: 'WhisperingError',
					title: 'Error registering local shortcut',
					description: 'Please make sure it is a valid keyboard shortcut.',
					action: { type: 'more-details', error },
					context: {},
					cause: error,
				}),
			});
			return registerNewCommandLocallyResult;
		},
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
			if (command.id === 'pushToTalk') {
				const registerPushToTalkGloballyResult = await tryAsync({
					try: async () => {
						if (!window.__TAURI_INTERNALS__) return;
						const { register } = await import(
							'@tauri-apps/plugin-global-shortcut'
						);
						return await register(keyCombination, (event) => {
							if (event.state === 'Pressed' || event.state === 'Released') {
								commandCallbacks.pushToTalk();
							}
						});
					},
					mapError: (error): WhisperingError => ({
						name: 'WhisperingError',
						title: 'Error registering global shortcut.',
						description:
							'Please make sure it is a valid Electron keyboard shortcut.',
						action: { type: 'more-details', error },
						context: {},
						cause: error,
					}),
				});
				return registerPushToTalkGloballyResult;
			}

			const registerNewShortcutKeyResult = await tryAsync({
				try: async () => {
					if (!window.__TAURI_INTERNALS__) return;
					const { register } = await import(
						'@tauri-apps/plugin-global-shortcut'
					);
					return await register(keyCombination, (event) => {
						if (event.state === 'Pressed') {
							commandCallbacks[command.id]();
						}
					});
				},
				mapError: (error): WhisperingError => ({
					name: 'WhisperingError',
					title: 'Error registering global shortcut.',
					description:
						'Please make sure it is a valid Electron keyboard shortcut.',
					action: { type: 'more-details', error },
					context: {},
					cause: error,
				}),
			});
			return registerNewShortcutKeyResult;
		},
	}),
};
