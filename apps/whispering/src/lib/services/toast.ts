import { goto } from '$app/navigation';
import { moreDetailsDialog } from '$lib/components/MoreDetailsDialog.svelte';
import { nanoid } from 'nanoid/non-secure';
import { toast as sonnerToast } from 'svelte-sonner';

import type { UnifiedNotificationOptions } from './notifications/types';

/**
 * Toast service implementation using Sonner
 *
 * This service handles in-app toast notifications with support for:
 * - Multiple variants (success, error, warning, info, loading)
 * - Actions (buttons, links, more details)
 * - Automatic duration based on content
 * - In-place updates using the same ID
 */
export const ToastServiceLive = {
	/**
	 * Dismiss a specific toast or all toasts
	 */
	dismiss(id?: number | string): void {
		sonnerToast.dismiss(id);
	},

	/**
	 * Show a toast with the specified options
	 */
	show(options: UnifiedNotificationOptions): string {
		const toastId = options.id ?? nanoid();

		// Use the appropriate Sonner method based on variant
		sonnerToast[options.variant](options.title, {
			description: options.description,
			action: convertActionToSonner(options.action),
			descriptionClass: 'line-clamp-6',
			duration: getDuration(options),
			id: toastId,
		});

		return toastId;
	},
};

export type ToastService = typeof ToastServiceLive;

// Helper to convert action to Sonner format
function convertActionToSonner(action: UnifiedNotificationOptions['action']) {
	if (!action) return undefined;

	switch (action.type) {
		case 'button':
			return {
				label: action.label,
				onClick: action.onClick,
			};

		case 'link':
			return {
				label: action.label,
				onClick: () => goto(action.href),
			};

		case 'more-details':
			return {
				label: 'More details',
				onClick: () =>
					moreDetailsDialog.open({
						title: 'More details',
						description: 'The following is the raw error message.',
						content: action.error,
					}),
			};
	}
}

// Helper to determine toast duration
function getDuration(options: UnifiedNotificationOptions): number {
	// Persistent toasts use Infinity duration
	if (options.persist) return Number.POSITIVE_INFINITY;

	if (options.variant === 'loading') return 5000;
	if (options.variant === 'error' || options.variant === 'warning') return 5000;
	if (options.action) return 4000;
	return 3000;
}
