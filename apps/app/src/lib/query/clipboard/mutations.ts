import { ClipboardService } from '$lib/services';
import { toast } from '$lib/services/toast';
import { createMutation } from '@epicenterhq/result';

export type CopyToClipboardLabel =
	| 'transcribed text'
	| 'transcribed text (joined)'
	| 'transformed text'
	| 'code'
	| 'latest transformation run output'
	| 'modifier'
	| 'key'
	| 'key combination';

export const copyTextToClipboardWithToast = createMutation({
	mutationFn: async ({
		text,
	}: {
		label: CopyToClipboardLabel;
		text: string;
	}) => {
		const copyResult = await ClipboardService.setClipboardText(text);
		return copyResult;
	},
	onSuccess: (_data, { input: { label, text } }) => {
		toast.success({
			title: `Copied ${label} to clipboard!`,
			description: text,
			descriptionClass: 'line-clamp-2',
		});
	},
	onError: (error, { input: { label } }) => {
		toast.error({
			title: `Error copying ${label} to clipboard`,
			description: error.description,
		});
	},
});
