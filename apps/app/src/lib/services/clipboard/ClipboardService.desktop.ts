import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { WhisperingError, WhisperingWarningProperties } from '@repo/shared';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { type } from '@tauri-apps/plugin-os';
import type { ClipboardService } from './ClipboardService';

export function createClipboardServiceDesktop(): ClipboardService {
	const writeTextToCursor = (text: string) =>
		tryAsync({
			try: () => invoke<void>('write_text', { text }),
			mapErr: (error) =>
				WhisperingError({
					title: '⚠️ Unable to paste from clipboard',
					description:
						'There was an error pasting from the clipboard using the Tauri Invoke API. Please try again.',
					action: { type: 'more-details', error },
				}),
		});

	return {
		setClipboardText: (text) =>
			tryAsync({
				try: () => writeText(text),
				mapErr: (error) =>
					WhisperingError({
						title: '⚠️ Unable to copy to clipboard',
						description:
							'There was an error writing to the clipboard using the Tauri Clipboard Manager API. Please try again.',
						action: { type: 'more-details', error },
					}),
			}),

		writeTextToCursor: async (text) => {
			const isMacos = type() === 'macos';

			if (!isMacos) {
				const { error: writeTextToCursorError } = await writeTextToCursor(text);
				if (writeTextToCursorError) return Err(writeTextToCursorError);

				return Ok(undefined);
			}

			const {
				data: isAccessibilityEnabled,
				error: isAccessibilityEnabledError,
			} = await tryAsync({
				try: () =>
					invoke<boolean>('is_macos_accessibility_enabled', {
						askIfNotAllowed: false,
					}),
				mapErr: (error) =>
					WhisperingError({
						title: '⚠️ Unable to ensure accessibility is enabled',
						description:
							'There was an error checking if accessibility is enabled using the Tauri Invoke API. Please try again.',
						action: { type: 'more-details', error },
					}),
			});

			if (isAccessibilityEnabledError) return Err(isAccessibilityEnabledError);

			if (!isAccessibilityEnabled) {
				return WhisperingWarningProperties({
					title:
						'Please enable or re-enable accessibility to paste transcriptions!',
					description:
						'Accessibility must be enabled or re-enabled for Whispering after install or update. Follow the link below for instructions.',
					action: {
						type: 'link',
						label: 'Open Directions',
						goto: '/macos-enable-accessibility',
					},
				});
			}

			const { error: writeTextToCursorError } = await writeTextToCursor(text);
			if (writeTextToCursorError) return Err(writeTextToCursorError);

			return Ok(undefined);
		},
	};
}
