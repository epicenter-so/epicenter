import type { MaybePromise, WhisperingError } from '$lib/result';
import { createTaggedError } from 'wellcrafted/error';
import type { Result } from 'wellcrafted/result';

const { ClipboardServiceError, ClipboardServiceErr } = createTaggedError(
	'ClipboardServiceError',
);
type ClipboardServiceError = ReturnType<typeof ClipboardServiceError>;
export { ClipboardServiceErr, ClipboardServiceError };

export type ClipboardService = {
	/**
	 * Copies text to the system clipboard.
	 * @param text The text to copy to the clipboard.
	 */
	copyToClipboard: (
		text: string,
	) => Promise<Result<void, ClipboardServiceError>>;

	/**
	 * Pastes text from the clipboard at the current cursor position.
	 * Simulates the standard paste keyboard shortcut (Cmd+V on macOS, Ctrl+V elsewhere).
	 *
	 * **Note**: The clipboard must already contain the text you want to paste.
	 * Call `copyToClipboard` first if needed.
	 *
	 * - Desktop: Simulates Cmd/Ctrl+V keyboard shortcut
	 * - Web: Uses browser paste API or extension messaging
	 * - Mobile: Triggers native paste action
	 */
	pasteFromClipboard: () => MaybePromise<
		Result<void, ClipboardServiceError | WhisperingError>
	>;
};
