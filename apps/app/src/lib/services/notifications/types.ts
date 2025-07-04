import type { ToastAndNotifyOptions } from '$lib/toasts';
import type { Result } from 'wellcrafted/result';
import type { TaggedError } from 'wellcrafted/error';

export type NotificationServiceError = TaggedError<'NotificationServiceError'>;

export type NotificationService = {
	notify: (
		options: ToastAndNotifyOptions,
	) => Promise<Result<string, NotificationServiceError>>;
	clear: (id: string) => Promise<Result<void, NotificationServiceError>>;
};
