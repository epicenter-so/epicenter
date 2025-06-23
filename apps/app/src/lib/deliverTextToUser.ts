import { toast } from '$lib/toast';
import { WHISPERING_RECORDINGS_PATHNAME } from '$lib/constants';
import { rpc } from './query';
import { settings } from '$lib/stores/settings.svelte';

/**
 * Delivers transcribed text to the user in their preferred way.
 *
 * This function presents completed transcription results to the user by:
 * 1. Always showing a success toast with the transcribed text
 * 2. Optionally copying the text to clipboard based on user preferences
 * 3. Optionally pasting the text at the cursor location based on user preferences
 * 4. Providing fallback actions (manual copy button or navigation to recordings)
 *
 * The function handles all clipboard operation errors gracefully with appropriate
 * fallback notifications and actions.
 *
 * @param text - The transcribed text to deliver
 * @param toastId - Unique ID for toast notifications to avoid duplicates
 */
export async function deliverTranscribedText({
	text,
	toastId,
}: {
	text: string;
	toastId: string;
}) {
	const userWantsClipboardCopy =
		settings.value['transcription.clipboard.copyOnSuccess'];
	const userWantsCursorPaste =
		settings.value['transcription.clipboard.pasteOnSuccess'];

	const statusToToastText = (status: null | 'COPIED' | 'COPIED+PASTED') => {
		switch (status) {
			case null:
				return '📝 Recording transcribed!';
			case 'COPIED':
				return '📝 Recording transcribed and copied to clipboard!';
			case 'COPIED+PASTED':
				return '📝 Recording transcribed, copied to clipboard, and pasted!';
		}
	};
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
	const { error: copyError } = await rpc.clipboard.copyToClipboard.execute({
		text,
	});
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
	const { error: pasteError } = await rpc.clipboard.writeTextToCursor.execute({
		text,
	});

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

/**
 * Delivers transformed text to the user in their preferred way.
 *
 * This function presents completed transformation results to the user by:
 * 1. Always showing a success toast with the transformed text
 * 2. Optionally copying the text to clipboard based on user preferences
 * 3. Optionally pasting the text at the cursor location based on user preferences
 * 4. Providing fallback actions (manual copy button or navigation to recordings)
 *
 * The function handles all clipboard operation errors gracefully with appropriate
 * fallback notifications and actions.
 *
 * @param text - The transformed text to deliver
 * @param toastId - Unique ID for toast notifications to avoid duplicates
 */
export async function deliverTransformedText({
	text,
	toastId,
}: {
	text: string;
	toastId: string;
}) {
	const userWantsClipboardCopy =
		settings.value['transformation.clipboard.copyOnSuccess'];
	const userWantsCursorPaste =
		settings.value['transformation.clipboard.pasteOnSuccess'];

	const statusToToastText = (status: null | 'COPIED' | 'COPIED+PASTED') => {
		switch (status) {
			case null:
				return '🔄 Transformation complete!';
			case 'COPIED':
				return '🔄 Transformation complete and copied to clipboard!';
			case 'COPIED+PASTED':
				return '🔄 Transformation complete, copied to clipboard, and pasted!';
		}
	};

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
							title: 'Error copying transformed text to clipboard',
							description: error.message,
							action: { type: 'more-details', error },
						});
					}
					toast.success({
						id: toastId,
						title: 'Copied transformed text to clipboard!',
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
	const { error: copyError } = await rpc.clipboard.copyToClipboard.execute({
		text,
	});
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
	const { error: pasteError } = await rpc.clipboard.writeTextToCursor.execute({
		text,
	});

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
