import { settings } from '$lib/stores/settings.svelte';
import { createJobQueue } from '$lib/utils/createJobQueue';
import { tryAsync, trySync } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingErrProperties } from '@repo/shared';
import type { CommandId } from '@repo/shared/settings';
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
			commandId,
			shortcutKey,
		}: {
			commandId: CommandId;
			shortcutKey: string;
		}) => {
			const currentCommandKey = settings.value[`shortcuts.local.${commandId}`];
			const unregisterOldCommandLocallyResult = trySync({
				try: () => hotkeys.unbind(currentCommandKey),
				mapErr: (error) =>
					WhisperingErr({
						title: `Error unregistering command with id ${commandId} locally`,
						description: 'Please try again.',
						action: { type: 'more-details', error },
					}),
			});
			if (!unregisterOldCommandLocallyResult.ok)
				return unregisterOldCommandLocallyResult;
			const registerNewCommandLocallyResult = trySync({
				try: () =>
					hotkeys(shortcutKey, (event) => {
						// Prevent the default refresh event under WINDOWS system
						event.preventDefault();
						commandCallbacks[commandId]();
					}),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Error registering local shortcut',
						description: 'Please make sure it is a valid keyboard shortcut.',
						action: { type: 'more-details', error },
					}),
			});
			if (!registerNewCommandLocallyResult.ok)
				return registerNewCommandLocallyResult;
			return registerNewCommandLocallyResult;
		},
		registerCommandGlobally: ({
			commandId,
			shortcutKey,
			onSuccess,
			onError,
		}: {
			commandId: CommandId;
			shortcutKey: string;
			onSuccess: () => void;
			onError: (error: WhisperingErrProperties) => void;
		}) => {
			const job = async () => {
				const oldShortcutKey = settings.value[`shortcuts.global.${commandId}`];
				const unregisterOldShortcutKeyResult = await tryAsync({
					try: async () => {
						if (!window.__TAURI_INTERNALS__) return;
						const { unregister } = await import(
							'@tauri-apps/plugin-global-shortcut'
						);
						return await unregister(oldShortcutKey);
					},
					mapErr: (error) =>
						WhisperingErr({
							title: `Error unregistering command with id ${commandId} globally`,
							description: 'Please try again.',
							action: { type: 'more-details', error },
						}),
				});
				if (!unregisterOldShortcutKeyResult.ok)
					return unregisterOldShortcutKeyResult;
				const registerNewShortcutKeyResult = await tryAsync({
					try: async () => {
						if (!window.__TAURI_INTERNALS__) return;
						const { register } = await import(
							'@tauri-apps/plugin-global-shortcut'
						);
						return await register(shortcutKey, (event) => {
							if (event.state === 'Pressed') {
								commandCallbacks[commandId]();
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
