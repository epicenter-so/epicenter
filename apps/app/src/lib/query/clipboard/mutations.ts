import { ClipboardService } from '$lib/services';
import { toast } from '$lib/services/toast';

export type CopyToClipboardLabel =
	| 'transcribed text'
	| 'transcribed text (joined)'
	| 'transformed text'
	| 'code'
	| 'latest transformation run output'
	| 'modifier'
	| 'key'
	| 'key combination';

export const copyTextToClipboardWithToast = async (
	{ label, text }: { label: CopyToClipboardLabel; text: string },
	{ onSuccess }: { onSuccess?: () => void } = {},
) => {
	const { error } = await ClipboardService.setClipboardText(text);
	if (error) {
		toast.error({
			title: `Error copying ${label} to clipboard`,
			description: error.description,
		});
	} else {
		toast.success({
			title: `Copied ${label} to clipboard!`,
			description: text,
			descriptionClass: 'line-clamp-2',
		});
		onSuccess?.();
	}
};
