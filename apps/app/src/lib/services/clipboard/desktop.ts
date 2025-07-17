import { WhisperingWarningErr } from '$lib/result';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { type } from '@tauri-apps/plugin-os';
import { Err, Ok, tryAsync } from 'wellcrafted/result';
import type { ClipboardService } from '.';
import { ClipboardServiceError } from './types';

export function createClipboardServiceDesktop(): ClipboardService {
	return {
		setClipboardText: (text) =>
			tryAsync({
				try: () => writeText(text),
				mapError: (error) =>
					ClipboardServiceError({
						message:
							'There was an error writing to the clipboard using the Tauri Clipboard Manager API. Please try again.',
						context: { text },
						cause: error,
					}),
			}),

		writeTextToCursor: async (text) => {
			const writeTextToCursor = (text: string) =>
				tryAsync({
					try: () => invoke<void>('write_text', { text }),
					mapError: (error) =>
						ClipboardServiceError({
							message:
								'There was an error pasting from the clipboard using the Tauri Invoke API. Please try again.',
							context: { text },
							cause: error,
						}),
				});

			// Attempt to write text first
			const { error: writeTextToCursorError } = await writeTextToCursor(text);

			// If no error, return success
			if (!writeTextToCursorError) return Ok(undefined);

			// If error and not macOS, propagate the error
			const isMacos = type() === 'macos';
			if (!isMacos) return Err(writeTextToCursorError);

			// On macOS, check accessibility permissions
			const {
				data: isAccessibilityEnabled,
				error: isAccessibilityEnabledError,
			} = await tryAsync({
				try: () =>
					invoke<boolean>('is_macos_accessibility_enabled', {
						askIfNotAllowed: false,
					}),
				mapError: (error) =>
					ClipboardServiceError({
						message:
							'There was an error checking if accessibility is enabled using the Tauri Invoke API. Please try again.',
						context: { text },
						cause: error,
					}),
			});

			if (isAccessibilityEnabledError) return Err(isAccessibilityEnabledError);

			// If accessibility is not enabled, return WhisperingWarning
			if (!isAccessibilityEnabled) {
				return WhisperingWarningErr({
					title:
						'Please enable or re-enable accessibility to paste transcriptions!',
					description:
						'Accessibility must be enabled or re-enabled for Whispering after install or update. Follow the link below for instructions.',
					action: {
						type: 'link',
						label: 'Open Directions',
						href: '/macos-enable-accessibility',
					},
				});
			}

			// If accessibility is enabled but write still failed, propagate original error
			return Err(writeTextToCursorError);
		},
	};
}
