import { defineMutation } from './_utils';
import { rpc } from './index';
import { settings } from '$lib/stores/settings.svelte';
import { WHISPERING_RECORDINGS_PATHNAME } from '$lib/constants/app';
import { Ok } from 'wellcrafted/result';

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
	 * @returns Result indicating successful delivery
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
		}: { text: string; toastId: string }) => {
			// Helper to show the basic toast with copy button
			const showBasicToast = () =>
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
								rpc.notify.error.execute({
									title: 'Error copying transcribed text to clipboard',
									description: error.message,
									action: { type: 'more-details', error },
								});
								return;
							}
							rpc.notify.success.execute({
								id: toastId,
								title: 'Copied transcribed text to clipboard!',
								description: text,
							});
						},
					},
				});

			// If user doesn't want auto-copy, just show the basic toast
			if (!settings.value['transcription.clipboard.copyOnSuccess']) {
				await showBasicToast();
				return Ok({ delivered: true });
			}

			// Try to copy to clipboard
			const { error: copyError } = await rpc.clipboard.copyToClipboard.execute({
				text,
			});
			if (copyError) {
				rpc.notify.warning.execute({
					title: '⚠️ Copy Operation Failed',
					description: 'Text could not be copied to clipboard automatically.',
					action: { type: 'more-details', error: copyError },
				});
				await showBasicToast();
				return Ok({ delivered: true });
			}

			// If user doesn't want auto-paste, show success with link to recordings
			if (!settings.value['transcription.clipboard.pasteOnSuccess']) {
				await rpc.notify.success.execute({
					id: toastId,
					title: '📝 Recording transcribed and copied to clipboard!',
					description: text,
					action: {
						type: 'link',
						label: 'Go to recordings',
						href: WHISPERING_RECORDINGS_PATHNAME,
					},
				});
				return Ok({ delivered: true });
			}

			// Try to paste at cursor
			const { error: pasteError } =
				await rpc.clipboard.writeTextToCursor.execute({ text });
			if (pasteError) {
				rpc.notify.warning.execute({
					title: '⚠️ Paste Operation Failed',
					description:
						'Text was copied to clipboard but could not be pasted automatically. Please use Ctrl+V (Cmd+V on Mac) to paste manually.',
					action: { type: 'more-details', error: pasteError },
				});
				// Still show success for copy
				await rpc.notify.success.execute({
					id: toastId,
					title: '📝 Recording transcribed and copied to clipboard!',
					description: text,
					action: {
						type: 'link',
						label: 'Go to recordings',
						href: WHISPERING_RECORDINGS_PATHNAME,
					},
				});
				return Ok({ delivered: true });
			}

			// Full success - copied and pasted
			await rpc.notify.success.execute({
				id: toastId,
				title: '📝 Recording transcribed, copied to clipboard, and pasted!',
				description: text,
				action: {
					type: 'link',
					label: 'Go to recordings',
					href: WHISPERING_RECORDINGS_PATHNAME,
				},
			});
			return Ok({ delivered: true });
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
	 * @returns Result indicating successful delivery
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
		}: { text: string; toastId: string }) => {
			// Helper to show the basic toast with copy button
			const showBasicToast = () =>
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
								rpc.notify.error.execute({
									title: 'Error copying transformed text to clipboard',
									description: error.message,
									action: { type: 'more-details', error },
								});
								return;
							}
							rpc.notify.success.execute({
								id: toastId,
								title: 'Copied transformed text to clipboard!',
								description: text,
							});
						},
					},
				});

			// If user doesn't want auto-copy, just show the basic toast
			if (!settings.value['transformation.clipboard.copyOnSuccess']) {
				await showBasicToast();
				return Ok({ delivered: true });
			}

			// Try to copy to clipboard
			const { error: copyError } = await rpc.clipboard.copyToClipboard.execute({
				text,
			});
			if (copyError) {
				rpc.notify.warning.execute({
					title: '⚠️ Copy Operation Failed',
					description: 'Text could not be copied to clipboard automatically.',
					action: { type: 'more-details', error: copyError },
				});
				await showBasicToast();
				return Ok({ delivered: true });
			}

			// If user doesn't want auto-paste, show success with link to recordings
			if (!settings.value['transformation.clipboard.pasteOnSuccess']) {
				await rpc.notify.success.execute({
					id: toastId,
					title: '🔄 Transformation complete and copied to clipboard!',
					description: text,
					action: {
						type: 'link',
						label: 'Go to recordings',
						href: WHISPERING_RECORDINGS_PATHNAME,
					},
				});
				return Ok({ delivered: true });
			}

			// Try to paste at cursor
			const { error: pasteError } =
				await rpc.clipboard.writeTextToCursor.execute({ text });
			if (pasteError) {
				rpc.notify.warning.execute({
					title: '⚠️ Paste Operation Failed',
					description:
						'Text was copied to clipboard but could not be pasted automatically. Please use Ctrl+V (Cmd+V on Mac) to paste manually.',
					action: { type: 'more-details', error: pasteError },
				});
				// Still show success for copy
				await rpc.notify.success.execute({
					id: toastId,
					title: '🔄 Transformation complete and copied to clipboard!',
					description: text,
					action: {
						type: 'link',
						label: 'Go to recordings',
						href: WHISPERING_RECORDINGS_PATHNAME,
					},
				});
				return Ok({ delivered: true });
			}

			// Full success - copied and pasted
			await rpc.notify.success.execute({
				id: toastId,
				title: '🔄 Transformation complete, copied to clipboard, and pasted!',
				description: text,
				action: {
					type: 'link',
					label: 'Go to recordings',
					href: WHISPERING_RECORDINGS_PATHNAME,
				},
			});
			return Ok({ delivered: true });
		},
	}),
};
