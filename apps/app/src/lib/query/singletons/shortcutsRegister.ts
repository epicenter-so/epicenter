import { createJobQueue } from '$lib/utils/createJobQueue';
import { tryAsync, trySync } from '@epicenterhq/result';
import type { Command } from '@repo/shared';
import { WhisperingErr } from '@repo/shared';
import hotkeys from 'hotkeys-js';
import { getContext, setContext } from 'svelte';
import type { CommandCallbacks } from './commands';

export const initShortcutsRegisterInContext = ({
	commandCallbacks,
}: {
	commandCallbacks: CommandCallbacks;
}) => {
	setContext(
		'shortcutsRegister',
		createShortcutsRegister({ commandCallbacks }),
	);
};

export const getShortcutsRegisterFromContext = () => {
	return getContext<ReturnType<typeof createShortcutsRegister>>(
		'shortcutsRegister',
	);
};

function createShortcutsRegister({
	commandCallbacks,
}: { commandCallbacks: CommandCallbacks }) {
	return {
		registerCommandLocally: ({
			command,
			keyCombination,
		}: {
			command: Command;
			keyCombination: string;
		}) => {
			const registerNewCommandLocallyResult = trySync({
				try: () =>
					hotkeys(keyCombination, (event) => {
						// Prevent the default refresh event under WINDOWS system
						event.preventDefault();
						commandCallbacks[command.id]();
						return false;
					}),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Error registering local shortcut',
						description: 'Please make sure it is a valid keyboard shortcut.',
						action: { type: 'more-details', error },
					}),
			});
			return registerNewCommandLocallyResult;
		},
		registerCommandGlobally: async ({
			command,
			keyCombination,
		}: {
			command: Command;
			keyCombination: string;
		}) => {
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
				mapErr: (error) =>
					WhisperingErr({
						title: 'Error registering global shortcut.',
						description:
							'Please make sure it is a valid Electron keyboard shortcut.',
						action: { type: 'more-details', error },
					}),
			});
			return registerNewShortcutKeyResult;
		},
	};
}
