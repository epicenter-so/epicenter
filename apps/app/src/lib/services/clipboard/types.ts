import type {
	MaybePromise,
	WhisperingError,
	WhisperingWarning,
} from '$lib/result';
import { createTaggedError } from 'wellcrafted/error';
import type { Result } from 'wellcrafted/result';

const { ClipboardServiceError, ClipboardServiceErr } = createTaggedError(
	'ClipboardServiceError',
);
type ClipboardServiceError = ReturnType<typeof ClipboardServiceError>;
export { ClipboardServiceError, ClipboardServiceErr };

export type ClipboardService = {
	/**
	 * Writes text to the user's clipboard.
	 * @param text The text to write to the clipboard.
	 */
	setClipboardText: (
		text: string,
	) => Promise<Result<void, ClipboardServiceError>>;

	/**
	 * Pastes text from the user's clipboard.
	 * - Web: No need to implement this function.
	 * - Desktop: This function should trigger a paste action, as if the user had pressed `Ctrl` + `V`.
	 * - Mobile: This function should trigger a paste action, as if the user had pressed `Paste` in the context menu.
	 */
	writeTextToCursor: (
		text: string,
	) => MaybePromise<
		Result<void, ClipboardServiceError | WhisperingWarning | WhisperingError>
	>;
};
