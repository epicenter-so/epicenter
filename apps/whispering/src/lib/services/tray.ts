// import { extension } from '@repo/extension';
import type { WhisperingRecordingState } from '$lib/constants/audio';

import { goto } from '$app/navigation';
import { Menu, MenuItem } from '@tauri-apps/api/menu';
import { resolveResource } from '@tauri-apps/api/path';
import { TrayIcon } from '@tauri-apps/api/tray';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { exit } from '@tauri-apps/plugin-process';
import { createTaggedError } from 'wellcrafted/error';
// import { commandCallbacks } from '$lib/commands';
import { type Err, Ok, tryAsync } from 'wellcrafted/result';

const TRAY_ID = 'whispering-tray';

const { SetTrayIconServiceErr, SetTrayIconServiceError } = createTaggedError(
	'SetTrayIconServiceError',
);
type SetTrayIconService = {
	setTrayIcon: (
		icon: WhisperingRecordingState,
	) => Promise<Err<SetTrayIconServiceError> | Ok<void>>;
};

type SetTrayIconServiceError = ReturnType<typeof SetTrayIconServiceError>;

export function createTrayIconDesktopService(): SetTrayIconService {
	const trayPromise = initTray();
	return {
		setTrayIcon: (recorderState: WhisperingRecordingState) =>
			tryAsync({
				mapErr: (error) =>
					SetTrayIconServiceErr({
						cause: error,
						context: { icon: recorderState },
						message: 'Failed to set tray icon',
					}),
				try: async () => {
					const iconPath = await getIconPath(recorderState);
					const tray = await trayPromise;
					return tray.setIcon(iconPath);
				},
			}),
	};
}

export function createTrayIconWebService(): SetTrayIconService {
	return {
		setTrayIcon: async (icon: WhisperingRecordingState) => {
			// const { error: setRecorderStateError } = await extension.setRecorderState(
			// 	{ recorderState: icon },
			// );
			// if (setRecorderStateError)
			// 	return SetTrayIconServiceErr({
			// 		message: 'Failed to set recorder state',
			// 		context: { icon },
			// 		cause: setRecorderStateError,
			// 	});
			return Ok(undefined);
		},
	};
}

async function getIconPath(recorderState: WhisperingRecordingState) {
	const iconPaths = {
		IDLE: 'recorder-state-icons/studio_microphone.png',
		RECORDING: 'recorder-state-icons/red_large_square.png',
	} as const satisfies Record<WhisperingRecordingState, string>;
	return await resolveResource(iconPaths[recorderState]);
}

async function initTray() {
	const existingTray = await TrayIcon.getById(TRAY_ID);
	if (existingTray) return existingTray;

	const trayMenu = await Menu.new({
		items: [
			// Window Controls Section
			await MenuItem.new({
				action: () => getCurrentWindow().show(),
				id: 'show',
				text: 'Show Window',
			}),

			await MenuItem.new({
				action: () => getCurrentWindow().hide(),
				id: 'hide',
				text: 'Hide Window',
			}),

			// Settings Section
			await MenuItem.new({
				action: () => {
					goto('/settings');
					return getCurrentWindow().show();
				},
				id: 'settings',
				text: 'Settings',
			}),

			// Quit Section
			await MenuItem.new({
				action: () => void exit(0),
				id: 'quit',
				text: 'Quit',
			}),
		],
	});

	const tray = await TrayIcon.new({
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
		icon: await getIconPath('IDLE'),
		id: TRAY_ID,
		menu: trayMenu,
		menuOnLeftClick: false,
	});

	return tray;
}

export const TrayIconServiceLive = window.__TAURI_INTERNALS__
	? createTrayIconDesktopService()
	: createTrayIconWebService();
