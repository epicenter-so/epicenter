import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { createJobQueue } from '$lib/utils/createJobQueue';
import { tryAsync, trySync } from '@epicenterhq/result';
import { WhisperingErr } from '@repo/shared';
import hotkeys from 'hotkeys-js';
import { getContext, setContext } from 'svelte';
import type { Commands } from './commands';
import { commandNames } from '@repo/shared/settings';

type RegisterShortcutJob = Promise<void>;

export const initShortcutsRegisterInContext = ({
	commands,
}: {
	commands: Commands;
}) => {
	setContext('shortcutsRegister', createShortcutsRegister({ commands }));
};

export const getShortcutsRegisterFromContext = () => {
	return getContext<ReturnType<typeof createShortcutsRegister>>(
		'shortcutsRegister',
	);
};

function createShortcutsRegister({ commands }: { commands: Commands }) {
	const jobQueue = createJobQueue<RegisterShortcutJob>();

	const initialSilentJob = async () => {
		unregisterAllLocalShortcuts();
		await unregisterAllGlobalShortcuts();

		for (const commandName of commandNames) {
			registerLocalShortcut({
				shortcut: settings.value[`shortcuts.local.${commandName}`],
				callback: commands[commandName],
			});
			await registerGlobalShortcut({
				shortcut: settings.value[`shortcuts.global.${commandName}`],
				callback: commands[commandName],
			});
		}
	};

	jobQueue.addJobToQueue(initialSilentJob());

	return {
		registerLocalShortcut: ({
			shortcut,
			callback,
		}: {
			shortcut: string;
			callback: () => void;
		}) => {
			const job = async () => {
				unregisterAllLocalShortcuts();
				registerLocalShortcut({ shortcut, callback });
				toast.success({
					title: `Local shortcut set to ${shortcut}`,
					description: 'Press the shortcut to start recording',
				});
			};
			jobQueue.addJobToQueue(job());
		},
		registerGlobalShortcut: ({
			shortcut,
			callback,
		}: {
			shortcut: string;
			callback: () => void;
		}) => {
			const job = async () => {
				if (!window.__TAURI_INTERNALS__) return;
				unregisterAllGlobalShortcuts();
				await registerGlobalShortcut({ shortcut, callback });
				toast.success({
					title: `Global shortcut set to ${shortcut}`,
					description: 'Press the shortcut to start recording',
				});
			};
			jobQueue.addJobToQueue(job());
		},
	};
}

function unregisterAllLocalShortcuts() {
	return trySync({
		try: () => hotkeys.unbind(),
		mapErr: (error) =>
			WhisperingErr({
				title: 'Error unregistering all shortcuts',
				description: 'Please try again.',
				action: { type: 'more-details', error },
			}),
	});
}

function unregisterAllGlobalShortcuts() {
	return tryAsync({
		try: async () => {
			if (!window.__TAURI_INTERNALS__) return;
			const { unregisterAll } = await import(
				'@tauri-apps/plugin-global-shortcut'
			);
			return await unregisterAll();
		},
		mapErr: (error) =>
			WhisperingErr({
				title: 'Error unregistering all shortcuts',
				description: 'Please try again.',
				action: { type: 'more-details', error },
			}),
	});
}

function registerLocalShortcut({
	shortcut,
	callback,
}: {
	shortcut: string;
	callback: () => void;
}) {
	const unregisterAllLocalShortcutsResult = unregisterAllLocalShortcuts();
	if (!unregisterAllLocalShortcutsResult.ok)
		return unregisterAllLocalShortcutsResult;
	return trySync({
		try: () =>
			hotkeys(shortcut, (event) => {
				// Prevent the default refresh event under WINDOWS system
				event.preventDefault();
				callback();
			}),
		mapErr: (error) =>
			WhisperingErr({
				title: 'Error registering local shortcut',
				description: 'Please make sure it is a valid keyboard shortcut.',
				action: { type: 'more-details', error },
			}),
	});
}

async function registerGlobalShortcut({
	shortcut,
	callback,
}: {
	shortcut: string;
	callback: () => void;
}) {
	const unregisterAllGlobalShortcutsResult =
		await unregisterAllGlobalShortcuts();
	if (!unregisterAllGlobalShortcutsResult.ok)
		return unregisterAllGlobalShortcutsResult;
	return tryAsync({
		try: async () => {
			if (!window.__TAURI_INTERNALS__) return;
			const { register } = await import('@tauri-apps/plugin-global-shortcut');
			return await register(shortcut, (event) => {
				if (event.state === 'Pressed') {
					callback();
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
}
