import { WHISPERING_RECORDINGS_PATHNAME } from '$lib/constants/app';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from 'wellcrafted/result';
import { defineMutation } from './_client';
import { rpc } from './index';
import type { ClipboardServiceError } from '$lib/services/clipboard';
import type { WhisperingError } from '$lib/result';

export const delivery = {
	/**
	 * Delivers transcribed text to the user according to their clipboard preferences.
	 *
	 * This mutation handles the complete delivery workflow for transcription results:
	 * 1. Shows a success toast with the transcribed text
	 * 2. Optionally copies text to clipboard based on user settings
	 * 3. Optionally pastes text at cursor based on user settings
	 * 4. Provides fallback UI actions when automatic operations fail
	 *
	 * The user's preferences are read from:
	 * - `transcription.clipboard.copyOnSuccess` - Whether to auto-copy
	 * - `transcription.clipboard.pasteOnSuccess` - Whether to auto-paste
	 *
	 * @param text - The transcribed text to deliver
	 * @param toastId - Unique ID for toast notifications to prevent duplicates
	 * @returns Result with no meaningful data (fire-and-forget operation)
	 *
	 * @example
	 * ```typescript
	 * // After transcription completes
	 * await rpc.delivery.deliverTranscriptionResult.execute({
	 *   text: transcribedText,
	 *   toastId: nanoid()
	 * });
	 * ```
	 */
	deliverTranscriptionResult: defineMutation({
		mutationKey: ['delivery', 'deliverTranscriptionResult'],
		resultMutationFn: async ({
			text,
			toastId,
		}: {
			text: string;
			toastId: string;
		}) => {
			// Shows transcription result and offers manual copy action
			const offerManualCopy = () =>
				rpc.notify.success.execute({
					id: toastId,
					title: '📝 Recording transcribed!',
					description: text,
					action: {
						type: 'button',
						label: 'Copy to clipboard',
						onClick: async () => {
							const { error } = await rpc.clipboard.copyToClipboard.execute({
								text,
							});
							if (error) {
								// Report that manual copy attempt failed
								rpc.notify.error.execute({
									title: 'Error copying transcribed text to clipboard',
									description: error.message,
									action: { type: 'more-details', error },
								});
								return;
							}
							// Confirm manual copy succeeded
							rpc.notify.success.execute({
								id: toastId,
								title: 'Copied transcribed text to clipboard!',
								description: text,
							});
						},
					},
				});

			// Warns that automatic copy failed and falls back to manual option
			const warnAutoCopyFailed = (error: ClipboardServiceError) => {
				rpc.notify.warning.execute({
					title: "Couldn't copy to clipboard",
					description: error.message,
					action: { type: 'more-details', error },
				});
			};

			// Confirms text is in clipboard (when paste is not attempted)
			const confirmTextInClipboard = () =>
				rpc.notify.success.execute({
					id: toastId,
					title: '📝 Recording transcribed and copied to clipboard!',
					description: text,
					action: {
						type: 'link',
						label: 'Go to recordings',
						href: WHISPERING_RECORDINGS_PATHNAME,
					},
				});

			// Warns that paste failed but confirms copy succeeded
			const warnPasteFailedButCopied = (
				error: ClipboardServiceError | WhisperingError,
			) => {
				if (error.name === 'ClipboardServiceError') {
					rpc.notify.warning.execute({
						title: 'Unable to paste automatically',
						description: error.message,
						action: { type: 'more-details', error },
					});
					return;
				}
				if (error.name === 'WhisperingError') {
					rpc.notify[error.severity].execute(error);
					return;
				}
			};

			// Confirms complete delivery (both copy and paste succeeded)
			const confirmFullDelivery = () =>
				rpc.notify.success.execute({
					id: toastId,
					title: '📝 Recording transcribed, copied to clipboard, and pasted!',
					description: text,
					action: {
						type: 'link',
						label: 'Go to recordings',
						href: WHISPERING_RECORDINGS_PATHNAME,
					},
				});

			// Main delivery flow

			// If user doesn't want auto-copy, just show the result with manual option
			if (!settings.value['transcription.clipboard.copyOnSuccess']) {
				offerManualCopy();
				return Ok(undefined);
			}

			// Try to copy to clipboard
			const { error: copyError } = await rpc.clipboard.copyToClipboard.execute({
				text,
			});
			if (copyError) {
				warnAutoCopyFailed(copyError);
				offerManualCopy();
				return Ok(undefined);
			}

			// If user doesn't want auto-paste, confirm copy only
			if (!settings.value['transcription.clipboard.pasteOnSuccess']) {
				confirmTextInClipboard();
				return Ok(undefined);
			}

			// Try to paste at cursor
			const { error: pasteError } =
				await rpc.clipboard.pasteFromClipboard.execute(undefined);
			if (pasteError) {
				warnPasteFailedButCopied(pasteError);
				confirmTextInClipboard();
				return Ok(undefined);
			}

			// Everything succeeded
			confirmFullDelivery();
			return Ok(undefined);
		},
	}),

	/**
	 * Delivers transformed text to the user according to their clipboard preferences.
	 *
	 * This mutation handles the complete delivery workflow for transformation results:
	 * 1. Shows a success toast with the transformed text
	 * 2. Optionally copies text to clipboard based on user settings
	 * 3. Optionally pastes text at cursor based on user settings
	 * 4. Provides fallback UI actions when automatic operations fail
	 *
	 * The user's preferences are read from:
	 * - `transformation.clipboard.copyOnSuccess` - Whether to auto-copy
	 * - `transformation.clipboard.pasteOnSuccess` - Whether to auto-paste
	 *
	 * @param text - The transformed text to deliver
	 * @param toastId - Unique ID for toast notifications to prevent duplicates
	 * @returns Result with no meaningful data (fire-and-forget operation)
	 *
	 * @example
	 * ```typescript
	 * // After transformation completes
	 * await rpc.delivery.deliverTransformationResult.execute({
	 *   text: transformedText,
	 *   toastId: nanoid()
	 * });
	 * ```
	 */
	deliverTransformationResult: defineMutation({
		mutationKey: ['delivery', 'deliverTransformationResult'],
		resultMutationFn: async ({
			text,
			toastId,
		}: {
			text: string;
			toastId: string;
		}) => {
			// Define all notification functions at the top for clarity

			// Shows transformation result and offers manual copy action
			const offerManualCopy = () =>
				rpc.notify.success.execute({
					id: toastId,
					title: '🔄 Transformation complete!',
					description: text,
					action: {
						type: 'button',
						label: 'Copy to clipboard',
						onClick: async () => {
							const { error } = await rpc.clipboard.copyToClipboard.execute({
								text,
							});
							if (error) {
								// Report that manual copy attempt failed
								rpc.notify.error.execute({
									title: 'Error copying transformed text to clipboard',
									description: error.message,
									action: { type: 'more-details', error },
								});
								return;
							}
							// Confirm manual copy succeeded
							rpc.notify.success.execute({
								id: toastId,
								title: 'Copied transformed text to clipboard!',
								description: text,
							});
						},
					},
				});

			// Warns that automatic copy failed and falls back to manual option
			const warnAutoCopyFailed = (error: ClipboardServiceError) => {
				rpc.notify.warning.execute({
					title: "Couldn't copy to clipboard",
					description: error.message,
					action: { type: 'more-details', error },
				});
			};

			// Confirms text is in clipboard (when paste is not attempted)
			const confirmTextInClipboard = () =>
				rpc.notify.success.execute({
					id: toastId,
					title: '🔄 Transformation complete and copied to clipboard!',
					description: text,
					action: {
						type: 'link',
						label: 'Go to recordings',
						href: WHISPERING_RECORDINGS_PATHNAME,
					},
				});

			// Warns that paste failed but confirms copy succeeded
			const warnPasteFailedButCopied = (
				error: ClipboardServiceError | WhisperingError,
			) => {
				if (error.name === 'ClipboardServiceError') {
					rpc.notify.error.execute({
						title: 'Error pasting transformed text to cursor',
						description: error.message,
						action: { type: 'more-details', error },
					});
					return;
				}
				if (error.name === 'WhisperingError') {
					rpc.notify[error.severity].execute(error);
					return;
				}
			};

			// Confirms complete delivery (both copy and paste succeeded)
			const confirmFullDelivery = () =>
				rpc.notify.success.execute({
					id: toastId,
					title: '🔄 Transformation complete, copied to clipboard, and pasted!',
					description: text,
					action: {
						type: 'link',
						label: 'Go to recordings',
						href: WHISPERING_RECORDINGS_PATHNAME,
					},
				});

			// Main delivery flow

			// If user doesn't want auto-copy, just show the result with manual option
			if (!settings.value['transformation.clipboard.copyOnSuccess']) {
				offerManualCopy();
				return Ok(undefined);
			}

			// Try to copy to clipboard
			const { error: copyError } = await rpc.clipboard.copyToClipboard.execute({
				text,
			});
			if (copyError) {
				warnAutoCopyFailed(copyError);
				offerManualCopy();
				return Ok(undefined);
			}

			// If user doesn't want auto-paste, confirm copy only
			if (!settings.value['transformation.clipboard.pasteOnSuccess']) {
				confirmTextInClipboard();
				return Ok(undefined);
			}

			// Try to paste at cursor
			const { error: pasteError } =
				await rpc.clipboard.pasteFromClipboard.execute(undefined);
			if (pasteError) {
				warnPasteFailedButCopied(pasteError);
				confirmTextInClipboard();
				return Ok(undefined);
			}

			// Everything succeeded
			confirmFullDelivery();
			return Ok(undefined);
		},
	}),
};
