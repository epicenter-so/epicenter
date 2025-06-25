import type { WhisperingWarning } from '$lib/result';
import { Err, Ok, type Result, tryAsync } from '@epicenterhq/result';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { type } from '@tauri-apps/plugin-os';
import type { ClipboardService, ClipboardServiceError } from '.';

export function createClipboardServiceDesktop(): ClipboardService {
	return {
		setClipboardText: (text) =>
			tryAsync({
				try: () => writeText(text),
				mapError: (error): ClipboardServiceError => ({
					name: 'ClipboardServiceError',
					message:
						'There was an error writing to the clipboard using the Tauri Clipboard Manager API. Please try again.',
					context: { text },
					cause: error,
				}),
			}),

		writeTextToCursor: async (text) => {
			const writeTextToCursor = (
				text: string,
			): Promise<Result<void, ClipboardServiceError>> =>
				tryAsync({
					try: () => invoke<void>('write_text', { text }),
					mapError: (error): ClipboardServiceError => ({
						name: 'ClipboardServiceError',
						message:
							'There was an error pasting from the clipboard using the Tauri Invoke API. Please try again.',
						context: { text },
						cause: error,
					}),
				});

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
				mapError: (error): ClipboardServiceError => ({
					name: 'ClipboardServiceError',
					message:
						'There was an error checking if accessibility is enabled using the Tauri Invoke API. Please try again.',
					context: { text },
					cause: error,
				}),
			});

			if (isAccessibilityEnabledError) return Err(isAccessibilityEnabledError);

			if (!isAccessibilityEnabled) {
				return Err({
					name: 'WhisperingWarning',
					title:
						'Please enable or re-enable accessibility to paste transcriptions!',
					description:
						'Accessibility must be enabled or re-enabled for Whispering after install or update. Follow the link below for instructions.',
					action: {
						type: 'link',
						label: 'Open Directions',
						goto: '/macos-enable-accessibility',
					},
					context: { text, isAccessibilityEnabled },
					cause: undefined,
				} satisfies WhisperingWarning);
			}

			const { error: writeTextToCursorError } = await writeTextToCursor(text);
			if (writeTextToCursorError) return Err(writeTextToCursorError);

			return Ok(undefined);
		},
	};
}
