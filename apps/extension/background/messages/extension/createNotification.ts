import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Err, Ok, tryAsync } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { ToastAndNotifyOptions, WhisperingResult } from '@repo/shared';
import { WhisperingError } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { extension } from '../../../lib/extension';
import { openWhisperingTab } from './openWhisperingTab';

export type CreateNotificationMessage = {
	notifyOptions: ToastAndNotifyOptions;
};
export type CreateNotificationResult = WhisperingResult<string>;

export const createNotification = async ({
	id = nanoid(),
	title,
	description,
	action,
}: ToastAndNotifyOptions): Promise<WhisperingResult<string>> => {
	switch (action?.type) {
		case 'link': {
			const { data: notificationId, error: createLinkNotificationError } =
				await tryAsync({
					try: async () => {
						chrome.notifications.create(id, {
							priority: 2,
							title,
							message: description,
							type: 'basic',
							buttons: [{ title: action.label }],
							iconUrl: studioMicrophone,
						});

						chrome.notifications.onClicked.addListener(async (clickedId) => {
							if (clickedId === id) {
								chrome.notifications.clear(id);
								const { error: gotoTargetUrlInWhisperingTabError } =
									await openWhisperingTab({ path: action.goto });
								if (gotoTargetUrlInWhisperingTabError) {
									extension.createNotification({
										notifyOptions: gotoTargetUrlInWhisperingTabError,
									});
								}
							}
						});

						chrome.notifications.onButtonClicked.addListener(
							async (id, buttonIndex) => {
								if (buttonIndex === 0) {
									chrome.notifications.clear(id);
									const { error: gotoTargetUrlInWhisperingTabError } =
										await openWhisperingTab({ path: action.goto });
									if (gotoTargetUrlInWhisperingTabError) {
										await extension.createNotification({
											notifyOptions: gotoTargetUrlInWhisperingTabError,
										});
									}
								}
							},
						);
						return id;
					},
					mapErr: (error) =>
						WhisperingError({
							title: 'Failed to show notification',
							description:
								'There was an error showing the notification in the background service worker.',
							action: { type: 'more-details', error },
						}),
				});
			if (createLinkNotificationError) return Err(createLinkNotificationError);
			return Ok(notificationId);
		}
		case 'more-details': {
			const { data: notificationId, error: createNotificationError } =
				await tryAsync({
					try: async () => {
						chrome.notifications.create(id, {
							priority: 2,
							requireInteraction: true,
							title,
							message: description,
							type: 'basic',
							iconUrl: studioMicrophone,
						});
						return id;
					},
					mapErr: (error) =>
						WhisperingError({
							title: 'Failed to show notification',
							description:
								'There was an error showing the notification in the background service worker.',
							action: { type: 'more-details', error },
						}),
				});
			if (createNotificationError) return Err(createNotificationError);
			return Ok(notificationId);
		}
		default: {
			const { data: notificationId, error: createNotificationError } =
				await tryAsync({
					try: async () => {
						chrome.notifications.create(id, {
							priority: 2,
							requireInteraction: true,
							title,
							message: description,
							type: 'basic',
							iconUrl: studioMicrophone,
						});
						return id;
					},
					mapErr: (error) =>
						WhisperingError({
							title: 'Failed to show notification',
							description:
								'There was an error showing the notification in the background service worker.',
							action: { type: 'more-details', error },
						}),
				});
			if (createNotificationError) return Err(createNotificationError);
			return Ok(notificationId);
		}
	}
};

const handler: PlasmoMessaging.MessageHandler<
	CreateNotificationMessage,
	CreateNotificationResult
> = async ({ body }, res) => {
	if (!body?.notifyOptions) {
		res.send(
			Err(
				WhisperingError({
					title: 'Error invoking notify command',
					description:
						'ToastOptions must be provided in the request body of the message',
				}),
			),
		);
		return;
	}
	res.send(await createNotification(body.notifyOptions));
};

export default handler;
