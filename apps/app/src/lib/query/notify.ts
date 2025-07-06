import { defineMutation } from './_utils';
import type { UnifiedNotificationOptions } from '$lib/services/notifications/types';
import * as services from '$lib/services';
import { Ok } from 'wellcrafted/result';
import { dev } from '$app/environment';
import { notificationLog } from '$lib/components/NotificationLog.svelte';

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

			// Always show toast
			const toastId = services.toast.show(fullOptions);

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
	dismiss: (id?: string | number) => services.toast.dismiss(id),
};
