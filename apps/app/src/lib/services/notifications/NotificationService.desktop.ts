import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { WhisperingError } from '@repo/shared';
import {
	active,
	isPermissionGranted,
	removeActive,
	requestPermission,
	sendNotification,
} from '@tauri-apps/plugin-notification';
import { nanoid } from 'nanoid/non-secure';
import type { NotificationService } from './NotificationService';

export function createNotificationServiceDesktop(): NotificationService {
	const removeNotificationById = async (id: number) => {
		const { data: activeNotifications, error: activeNotificationsError } =
			await tryAsync({
				try: async () => await active(),
				mapErr: (error) =>
					WhisperingError({
						title: 'Unable to remove notification',
						description: 'Unable to retrieve active notifications.',
						action: { type: 'more-details', error },
					}),
			});
		if (activeNotificationsError) return Err(activeNotificationsError);
		const matchingActiveNotification = activeNotifications.find(
			(notification) => notification.id === id,
		);
		if (matchingActiveNotification) {
			const { error: removeActiveError } = await tryAsync({
				try: async () => await removeActive([matchingActiveNotification]),
				mapErr: (error) =>
					WhisperingError({
						title: 'Unable to remove notification',
						description: `An error occurred while trying to remove notification with id ${id}.`,
						action: { type: 'more-details', error },
					}),
			});
			if (removeActiveError) return Err(removeActiveError);
		}
		return Ok(undefined);
	};

	return {
		async notify({ id: idStringified = nanoid(), title, description }) {
			const id = stringToNumber(idStringified);

			await removeNotificationById(id);

			const { error: notifyError } = await tryAsync({
				try: async () => {
					let permissionGranted = await isPermissionGranted();
					if (!permissionGranted) {
						const permission = await requestPermission();
						permissionGranted = permission === 'granted';
					}
					if (permissionGranted) {
						sendNotification({ id: id, title, body: description });
					}
				},
				mapErr: (error) =>
					WhisperingError({
						title: 'Notification error',
						description: 'Could not send notification',
						action: {
							type: 'more-details',
							error,
						},
					}),
			});
			if (notifyError) return Err(notifyError);
			return Ok(idStringified);
		},
		clear: async (idStringified) => {
			const removeNotificationResult = await removeNotificationById(
				stringToNumber(idStringified),
			);
			return removeNotificationResult;
		},
	};
}

function stringToNumber(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}
