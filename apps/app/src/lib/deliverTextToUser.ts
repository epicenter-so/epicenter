import { services } from '$lib/services';
import { toast } from '$lib/toast';
import { WHISPERING_RECORDINGS_PATHNAME } from '@repo/shared';
import { rpc } from './query';

/**
 * Delivers processed text to the user in their preferred way.
 *
 * This function presents completed text processing results to the user by:
 * 1. Always showing a success toast with the processed text
 * 2. Optionally copying the text to clipboard based on user preferences
 * 3. Optionally pasting the text at the cursor location based on user preferences
 * 4. Providing fallback actions (manual copy button or navigation to recordings)
 *
 * The function handles all clipboard operation errors gracefully with appropriate
 * fallback notifications and actions.
 *
 * @param text - The processed text to deliver (transcription, transformation output, etc.)
 * @param toastId - Unique ID for toast notifications to avoid duplicates
 * @param userWantsClipboardCopy - Whether to copy text to clipboard based on user preferences
 * @param userWantsCursorPaste - Whether to paste text at cursor based on user preferences
 * @param statusToToastText - Function that generates context-appropriate toast messages
 */
export async function deliverTextToUser({
	text,
	toastId,
	userWantsClipboardCopy,
	userWantsCursorPaste,
	statusToToastText,
}: {
	text: string;
	toastId: string;
	userWantsClipboardCopy: boolean;
	userWantsCursorPaste: boolean;
	statusToToastText: (status: null | 'COPIED' | 'COPIED+PASTED') => string;
}) {
	const showBasicToast = () =>
		toast.success({
			id: toastId,
			title: statusToToastText(null),
			description: text,
			action: {
				type: 'button',
				label: 'Copy to clipboard',
				onClick: async () => {
					const { error } = await rpc.clipboard.copyToClipboard.execute({
						text,
					});
					if (error) {
						toast.error({
							title: 'Error copying transcribed text to clipboard',
							description: error.message,
							action: { type: 'more-details', error },
						});
					}
					toast.success({
						id: toastId,
						title: 'Copied transcribed text to clipboard!',
						description: text,
					});
				},
			},
		});

	const showCopiedToast = () =>
		toast.success({
			id: toastId,
			title: statusToToastText('COPIED'),
			description: text,
			action: {
				type: 'link',
				label: 'Go to recordings',
				goto: WHISPERING_RECORDINGS_PATHNAME,
			},
		});

	const showCopiedAndPastedToast = () =>
		toast.success({
			id: toastId,
			title: statusToToastText('COPIED+PASTED'),
			description: text,
			action: {
				type: 'link',
				label: 'Go to recordings',
				goto: WHISPERING_RECORDINGS_PATHNAME,
			},
		});

	// Do I need to copy to clipboard?
	if (!userWantsClipboardCopy) {
		return showBasicToast(); // Just show the text with manual copy option
	}

	// Can I copy to clipboard?
	const { error: copyError } = await services.clipboard.setClipboardText(text);
	const clipboardCopyFailed = copyError;

	if (clipboardCopyFailed) {
		toast.warning({
			title: '⚠️ Copy Operation Failed',
			description: 'Text could not be copied to clipboard automatically.',
			action: { type: 'more-details', error: copyError },
		});
		showBasicToast();
		return;
	}

	// Do I need to paste at cursor?
	if (!userWantsCursorPaste) {
		return showCopiedToast(); // Text copied but no paste needed
	}

	// Can I paste at cursor?
	const { error: pasteError } =
		await services.clipboard.writeTextToCursor(text);

	if (pasteError) {
		toast.warning({
			title: '⚠️ Paste Operation Failed',
			description:
				'Text was copied to clipboard but could not be pasted automatically. Please use Ctrl+V (Cmd+V on Mac) to paste manually.',
			action: { type: 'more-details', error: pasteError },
		});
		showCopiedToast();
		return;
	}

	// Success - both copy and paste worked
	showCopiedAndPastedToast();
}
