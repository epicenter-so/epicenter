import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import { WhisperingError } from '@repo/shared';
import type { ClipboardService } from './ClipboardService';

export function createClipboardServiceWeb(): ClipboardService {
	return {
		setClipboardText: async (text) => {
			const { error: setClipboardError } = await tryAsync({
				try: () => navigator.clipboard.writeText(text),
				mapErr: (error) =>
					WhisperingError({
						title: '⚠️ Unable to copy to clipboard',
						description:
							'There was an error copying to the clipboard using the browser Clipboard API. Please try again.',
						action: { type: 'more-details', error },
					}),
			});

			if (setClipboardError) {
				const { error: extensionSetClipboardError } =
					await extension.setClipboardText({
						transcribedText: text,
					});
				if (extensionSetClipboardError) {
					return extensionSetClipboardError._tag ===
						'ExtensionNotAvailableError'
						? Err(setClipboardError)
						: Err(WhisperingError(extensionSetClipboardError));
				}
				return Ok(undefined);
			}
			return Ok(undefined);
		},

		writeTextToCursor: async (text) => {
			const { error: writeTextToCursorError } =
				await extension.writeTextToCursor({
					transcribedText: text,
				});
			if (writeTextToCursorError) {
				if (writeTextToCursorError._tag === 'ExtensionNotAvailableError') {
					return Err(
						WhisperingError({
							title: '⚠️ Extension Not Available',
							description:
								'The Whispering extension is not available. Please install it to enable writing transcribed text to the cursor.',
							action: { type: 'more-details', error: writeTextToCursorError },
						}),
					);
				}
				return Err(WhisperingError(writeTextToCursorError));
			}
			return Ok(undefined);
		},
	};
}
