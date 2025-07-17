import { Ok, tryAsync } from 'wellcrafted/result';
// import { extension } from '@repo/extension';
import type { ClipboardService } from '.';
import { ClipboardServiceErr, ClipboardServiceError } from './types';
// import { WhisperingErr } from '$lib/result';

export function createClipboardServiceWeb(): ClipboardService {
	return {
		copyToClipboard: async (text) => {
			const { error: copyError } = await tryAsync({
				try: () => navigator.clipboard.writeText(text),
				mapError: (error) =>
					ClipboardServiceError({
						message:
							'There was an error copying to the clipboard using the browser Clipboard API. Please try again.',
						context: { text },
						cause: error,
					}),
			});

			if (copyError) {
				// Extension fallback code commented out for now
				// Could be re-enabled if extension support is needed
				return Ok(undefined);
			}
			return Ok(undefined);
		},

		pasteFromClipboard: async () => {
			// In web browsers, we cannot programmatically paste for security reasons
			// The user must manually paste with Cmd/Ctrl+V
			return ClipboardServiceErr({
				message:
					'Automatic paste is not supported in web browsers for security reasons. Please paste manually using Cmd/Ctrl+V.',
				cause: undefined,
			});
		},
	};
}
