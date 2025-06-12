import { services } from '$lib/services';
import { toast } from '$lib/services/toast';
import { WHISPERING_RECORDINGS_PATHNAME } from '@repo/shared';
import { rpc } from './query';

export async function maybeCopyAndPaste({
	text,
	toastId,
	shouldCopy,
	shouldPaste,
	statusToToastText,
}: {
	text: string;
	toastId: string;
	shouldCopy: boolean;
	shouldPaste: boolean;
	statusToToastText: (status: null | 'COPIED' | 'COPIED+PASTED') => string;
}) {
	const toastNull = () =>
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

	const toastCopied = () =>
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

	const toastCopiedAndPasted = () =>
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
	if (!shouldCopy) return toastNull();

	const { error: copyError } = await services.clipboard.setClipboardText(text);
	if (copyError) {
		toast.warning(copyError);
		toastNull();
		return;
	}

	if (!shouldPaste) return toastCopied();

	const { error: pasteError } =
		await services.clipboard.writeTextToCursor(text);
	if (pasteError) {
		toast.warning({
			title: '⚠️ Paste Operation Failed',
			description:
				'Text was copied to clipboard but could not be pasted automatically. Please use Ctrl+V (Cmd+V on Mac) to paste manually.',
			action: { type: 'more-details', error: pasteError },
		});
		toastCopied();
		return;
	}

	toastCopiedAndPasted();
}
