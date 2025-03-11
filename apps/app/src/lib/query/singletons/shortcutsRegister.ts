import { createJobQueue } from '$lib/utils/createJobQueue';
import { tryAsync, trySync } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingErrProperties } from '@repo/shared';
import type { Command } from '@repo/shared';
import hotkeys from 'hotkeys-js';
import { getContext, setContext } from 'svelte';
import type { CommandCallbacks } from './commands';

type RegisterShortcutJob = Promise<void>;

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
	const jobQueue = createJobQueue<RegisterShortcutJob>();

	return {
		registerCommandLocally: ({
			command,
			shortcutKey,
			onSuccess,
			onError,
		}: {
			command: Command;
			shortcutKey: string;
			onSuccess: () => void;
			onError: (error: WhisperingErrProperties) => void;
		}) => {
			const registerNewCommandLocallyResult = trySync({
				try: () =>
					hotkeys(shortcutKey, (event) => {
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
			if (!registerNewCommandLocallyResult.ok) {
				onError(registerNewCommandLocallyResult.error);
			} else {
				onSuccess();
			}
		},
		registerCommandGlobally: ({
			command,
			shortcutKey,
			onSuccess,
			onError,
		}: {
			command: Command;
			shortcutKey: string;
			onSuccess: () => void;
			onError: (error: WhisperingErrProperties) => void;
		}) => {
			const job = async () => {
				const registerNewShortcutKeyResult = await tryAsync({
					try: async () => {
						if (!window.__TAURI_INTERNALS__) return;
						const { register } = await import(
							'@tauri-apps/plugin-global-shortcut'
						);
						return await register(shortcutKey, (event) => {
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
				if (!registerNewShortcutKeyResult.ok)
					return registerNewShortcutKeyResult;
				return registerNewShortcutKeyResult;
			};

			jobQueue.addJobToQueue(async () => {
				const result = await job();
				if (result.ok) {
					onSuccess();
				} else {
					onError(result.error);
				}
			});
		},
	};
}
