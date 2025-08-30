import {
	active,
	isPermissionGranted,
	removeActive,
	requestPermission,
	sendNotification,
} from '@tauri-apps/plugin-notification';
import { nanoid } from 'nanoid/non-secure';
import { Err, Ok, type Result, tryAsync } from 'wellcrafted/result';

import type { NotificationService, UnifiedNotificationOptions } from './types';

import {
	hashNanoidToNumber,
	NotificationServiceErr,
	type NotificationServiceError,
	toTauriNotification,
} from './types';

export function createNotificationServiceDesktop(): NotificationService {
	const removeNotificationById = async (
		id: number,
	): Promise<Result<void, NotificationServiceError>> => {
		const { data: activeNotifications, error: activeNotificationsError } =
			await tryAsync({
				mapErr: (error) =>
					NotificationServiceErr({
						cause: error,
						context: { id },
						message: 'Unable to retrieve active desktop notifications.',
					}),
				try: async () => await active(),
			});
		if (activeNotificationsError) return Err(activeNotificationsError);
		const matchingActiveNotification = activeNotifications.find(
			(notification) => notification.id === id,
		);
		if (matchingActiveNotification) {
			const { error: removeActiveError } = await tryAsync({
				mapErr: (error) =>
					NotificationServiceErr({
						cause: error,
						context: { id, matchingActiveNotification },
						message: `Unable to remove notification with id ${id}.`,
					}),
				try: async () => await removeActive([matchingActiveNotification]),
			});
			if (removeActiveError) return Err(removeActiveError);
		}
		return Ok(undefined);
	};

	return {
		clear: async (idStringified) => {
			const removeNotificationResult = await removeNotificationById(
				hashNanoidToNumber(idStringified),
			);
			return removeNotificationResult;
		},
		async notify(options: UnifiedNotificationOptions) {
			const idStringified = options.id ?? nanoid();
			const id = hashNanoidToNumber(idStringified);

			await removeNotificationById(id);

			const { error: notifyError } = await tryAsync({
				mapErr: (error) =>
					NotificationServiceErr({
						cause: error,
						context: {
							title: options.title,
							description: options.description,
							idStringified,
						},
						message: 'Could not send notification',
					}),
				try: async () => {
					let permissionGranted = await isPermissionGranted();
					if (!permissionGranted) {
						const permission = await requestPermission();
						permissionGranted = permission === 'granted';
					}
					if (permissionGranted) {
						const tauriOptions = toTauriNotification(options);
						sendNotification({
							...tauriOptions,
							id, // Override with our numeric id
						});
					}
				},
			});
			if (notifyError) return Err(notifyError);
			return Ok(idStringified);
		},
	};
}
