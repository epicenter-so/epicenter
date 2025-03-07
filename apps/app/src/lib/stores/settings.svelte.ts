import type { Recorder } from '$lib/query/singletons/recorder';
import { toast } from '$lib/services/toast';
import { createJobQueue } from '$lib/utils/createJobQueue';
import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
import { tryAsync, trySync } from '@epicenterhq/result';
import { WhisperingErr } from '@repo/shared';
import {
	getDefaultSettingsV1,
	migrateV1ToV2,
	migrateV2ToV3,
	settingsV1Schema,
	settingsV2Schema,
	settingsV3Schema,
} from '@repo/shared/settings';
import hotkeys from 'hotkeys-js';
import { getContext, setContext } from 'svelte';

const settingsV1 = createPersistedState({
	key: 'whispering-settings',
	schema: settingsV1Schema,
	defaultValue: getDefaultSettingsV1(),
});

export const settingsV2 = createPersistedState({
	key: 'whispering-settings',
	schema: settingsV2Schema,
	defaultValue: migrateV1ToV2(settingsV1.value),
});

export const settings = createPersistedState({
	key: 'whispering-settings',
	schema: settingsV3Schema,
	defaultValue: migrateV2ToV3(settingsV1.value),
});

type RegisterShortcutJob = Promise<void>;

export const initRegisterShortcutsInContext = ({
	recorder,
}: {
	recorder: Recorder;
}) => {
	setContext('registerShortcuts', createRegisterShortcuts({ recorder }));
};

export const getRegisterShortcutsFromContext = () => {
	return getContext<ReturnType<typeof createRegisterShortcuts>>(
		'registerShortcuts',
	);
};

function createRegisterShortcuts({ recorder }: { recorder: Recorder }) {
	const jobQueue = createJobQueue<RegisterShortcutJob>();

	const initialSilentJob = async () => {
		unregisterAllLocalShortcuts();
		await unregisterAllGlobalShortcuts();
		registerLocalShortcut({
			shortcut: settings.value['shortcuts.currentLocalShortcut'],
			callback: recorder.toggleRecording,
		});
		await registerGlobalShortcut({
			shortcut: settings.value['shortcuts.currentGlobalShortcut'],
			callback: recorder.toggleRecording,
		});
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
