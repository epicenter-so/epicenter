import { Err, Ok } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import type { NotificationService } from './NotificationService';

export function createNotificationServiceWeb(): NotificationService {
	return {
		notify: async (notifyOptions) => {
			const { data: notificationId, error: createNotificationError } =
				await extension.createNotification({
					notifyOptions,
				});
			if (createNotificationError) return Err(createNotificationError);
			return Ok(notificationId);
		},
		clear: async (notificationId: string) => {
			const { error: clearNotificationError } =
				await extension.clearNotification({
					notificationId,
				});
			if (clearNotificationError) return Err(clearNotificationError);
			return Ok(undefined);
		},
	};
}
