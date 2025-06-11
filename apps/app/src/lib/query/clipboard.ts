import { ClipboardService } from '$lib/services';
import { defineMutation } from '.';

export type CopyToClipboardLabel =
	| 'transcribed text'
	| 'transcribed text (joined)'
	| 'transformed text'
	| 'code'
	| 'latest transformation run output'
	| 'modifier'
	| 'key'
	| 'key combination';

export const clipboard = {
	copyToClipboard: defineMutation({
		mutationKey: ['clipboard', 'copyToClipboard'],
		resultMutationFn: ({ text }: { text: string }) =>
			ClipboardService.setClipboardText(text),
	}),
};
