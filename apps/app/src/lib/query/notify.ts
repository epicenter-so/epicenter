import { defineMutation } from './_utils';
import type { UnifiedNotificationOptions } from '$lib/services/notifications/types';
import * as services from '$lib/services';
import { toast as sonnerToast } from 'svelte-sonner';
import { nanoid } from 'nanoid/non-secure';
import { Ok } from 'wellcrafted/result';
import { dev } from '$app/environment';
import { goto } from '$app/navigation';
import { moreDetailsDialog } from '$lib/components/MoreDetailsDialog.svelte';
import { notificationLog } from '$lib/components/NotificationLog.svelte';

// Helper to determine toast duration
function getDuration(options: UnifiedNotificationOptions) {
	if (options.variant === 'loading') return 5000;
	if (options.variant === 'error' || options.variant === 'warning') return 5000;
	if (options.action) return 4000;
	return 3000;
}

// Helper to convert action to Sonner format
function convertUnifiedActionToSonner(
	action: UnifiedNotificationOptions['action'],
) {
	if (!action) return undefined;

	switch (action.type) {
		case 'link':
			return {
				label: action.label,
				onClick: () => goto(action.href),
			};

		case 'button':
			return {
				label: action.label,
				onClick: action.onClick,
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

// Create a mutation for a specific variant
const createNotifyMutation = (
	variant: NonNullable<UnifiedNotificationOptions['variant']>,
) =>
	defineMutation({
		mutationKey: ['notify', variant],
		resultMutationFn: async (
			options: Omit<UnifiedNotificationOptions, 'variant'>,
		) => {
			const fullOptions: UnifiedNotificationOptions = { ...options, variant };
			const toastId = fullOptions.id ?? nanoid();

			// Log in dev mode
			if (dev) {
				switch (variant) {
					case 'error':
						console.error('[Notify]', fullOptions);
						break;
					case 'warning':
						console.warn('[Notify]', fullOptions);
						break;
					case 'info':
						console.info('[Notify]', fullOptions);
						break;
					case 'loading':
						console.info('[Notify]', fullOptions);
						break;
					case 'success':
						console.log('[Notify]', fullOptions);
						break;
				}
			}

			// Add to notification log
			notificationLog.addLog(fullOptions);

			// Always show Sonner toast
			sonnerToast[variant](fullOptions.title, {
				id: toastId,
				description: fullOptions.description,
				descriptionClass: 'line-clamp-6',
				duration: getDuration(fullOptions),
				action: convertUnifiedActionToSonner(fullOptions.action),
			});

			// Also show OS notification (system notifications or browser/extension notifications)
			// We exclude 'loading' notifications because:
			// 1. OS notifications don't support updating/replacing notifications with the same ID
			//    (unlike Sonner toasts which can update in-place)
			// 2. Loading states are temporary and would create notification spam
			if (variant !== 'loading') {
				const { error: notifyError } =
					await services.notification.notify(fullOptions);
				if (notifyError) {
					console.error('[Notify] OS notification error:', notifyError);
				}
			}

			return Ok(toastId);
		},
	});

// Export the notify API
export const notify = {
	// Variant-specific methods
	success: createNotifyMutation('success'),
	error: createNotifyMutation('error'),
	warning: createNotifyMutation('warning'),
	info: createNotifyMutation('info'),
	loading: createNotifyMutation('loading'),

	// Dismiss method
	dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};
