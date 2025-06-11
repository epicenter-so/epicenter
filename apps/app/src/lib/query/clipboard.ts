import { services } from '$lib/services';
import { defineMutation } from '.';

export const clipboard = {
	copyToClipboard: defineMutation({
		mutationKey: ['clipboard', 'copyToClipboard'],
		resultMutationFn: ({ text }: { text: string }) =>
			services.clipboard.setClipboardText(text),
	}),
};
