import type { Result, TaggedError } from '@epicenterhq/result';
import type { ToastAndNotifyOptions } from '$lib/toasts';

export type NotificationServiceError = TaggedError<'NotificationServiceError'>;

export type NotificationService = {
	notify: (
		options: ToastAndNotifyOptions,
	) => Promise<Result<string, NotificationServiceError>>;
	clear: (id: string) => Promise<Result<void, NotificationServiceError>>;
};
