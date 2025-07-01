import { goto } from '$app/navigation';
// import { commandCallbacks } from '$lib/commands';
import { type Err, Ok, type TaggedError, tryAsync } from '@epicenterhq/result';
// import { extension } from '@repo/extension';
import {
	ALWAYS_ON_TOP_VALUES,
	type WhisperingRecordingState,
} from '$lib/constants';
import { CheckMenuItem, Menu, MenuItem } from '@tauri-apps/api/menu';
import { resolveResource } from '@tauri-apps/api/path';
import { TrayIcon } from '@tauri-apps/api/tray';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { exit } from '@tauri-apps/plugin-process';

const TRAY_ID = 'whispering-tray';

export type SetTrayIconServiceErrorProperties =
	TaggedError<'SetTrayIconServiceError'>;

export type SetTrayIconServiceResult<T> =
	| Ok<T>
	| Err<SetTrayIconServiceErrorProperties>;

type TrayIconSettings = {
	alwaysOnTop: string;
};

type SetTrayIconService = {
	setTrayIcon: (
		icon: WhisperingRecordingState,
	) => Promise<SetTrayIconServiceResult<void>>;
};

export function createSetTrayIconWebService({
	settings,
}: {
	settings: TrayIconSettings;
}): SetTrayIconService {
	return {
		setTrayIcon: async (icon: WhisperingRecordingState) => {
			// const { error: setRecorderStateError } = await extension.setRecorderState(
			// 	{ recorderState: icon },
			// );
			// if (setRecorderStateError)
			// 	return Err({
			// 		name: 'SetTrayIconServiceError',
			// 		message: 'Failed to set recorder state',
			// 		context: { icon },
			// 		cause: setRecorderStateError,
			// 	} as SetTrayIconServiceErrorProperties);
			return Ok(undefined);
		},
	};
}

export function createSetTrayIconDesktopService({
	settings,
}: {
	settings: TrayIconSettings;
}): SetTrayIconService {
	const trayPromise = initTray(settings);
	return {
		setTrayIcon: (recorderState: WhisperingRecordingState) =>
			tryAsync({
				try: async () => {
					const iconPath = await getIconPath(recorderState);
					const tray = await trayPromise;
					return tray.setIcon(iconPath);
				},
				mapError: (error): SetTrayIconServiceErrorProperties => ({
					name: 'SetTrayIconServiceError',
					message: 'Failed to set tray icon',
					context: { icon: recorderState },
					cause: error,
				}),
			}),
	};
}

async function initTray(settings: TrayIconSettings) {
	const existingTray = await TrayIcon.getById(TRAY_ID);
	if (existingTray) return existingTray;

	const alwaysOnTopItems = await Promise.all(
		ALWAYS_ON_TOP_VALUES.map(async (value) =>
			CheckMenuItem.new({
				id: `always-on-top-${value}`,
				text: `Always on Top: ${value}`,
				checked: settings.alwaysOnTop === value,
				action: async (id) => {
					// Note: This action will need to be handled by the query layer
					// For now, we'll just update the menu items
					await Promise.all(
						alwaysOnTopItems.map(async (item) => {
							await item.setChecked(item.id === id);
						}),
					);
				},
			}),
		),
	);

	const trayMenu = await Menu.new({
		items: [
			// Window Controls Section
			await MenuItem.new({
				id: 'show',
				text: 'Show Window',
				action: () => getCurrentWindow().show(),
			}),

			await MenuItem.new({
				id: 'hide',
				text: 'Hide Window',
				action: () => getCurrentWindow().hide(),
			}),

			// Always on Top Section
			...alwaysOnTopItems,

			// Settings Section
			await MenuItem.new({
				id: 'settings',
				text: 'Settings',
				action: () => {
					goto('/settings');
					return getCurrentWindow().show();
				},
			}),

			// Quit Section
			await MenuItem.new({
				id: 'quit',
				text: 'Quit',
				action: () => void exit(0),
			}),
		],
	});

	const tray = await TrayIcon.new({
		id: TRAY_ID,
		icon: await getIconPath('IDLE'),
		menu: trayMenu,
		menuOnLeftClick: false,
		action: (e) => {
			if (
				e.type === 'Click' &&
				e.button === 'Left' &&
				e.buttonState === 'Down'
			) {
				// commandCallbacks.toggleManualRecording();
				return true;
			}
			return false;
		},
	});

	return tray;
}

async function getIconPath(recorderState: WhisperingRecordingState) {
	const iconPaths = {
		IDLE: 'recorder-state-icons/studio_microphone.png',
		RECORDING: 'recorder-state-icons/red_large_square.png',
	} as const satisfies Record<WhisperingRecordingState, string>;
	return await resolveResource(iconPaths[recorderState]);
}

export function createSetTrayIconService({
	settings,
}: {
	settings: TrayIconSettings;
}): SetTrayIconService {
	return window.__TAURI_INTERNALS__
		? createSetTrayIconDesktopService({ settings })
		: createSetTrayIconWebService({ settings });
}
