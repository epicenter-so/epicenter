import { Err, Ok, trySync } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import { WhisperingError, type WhisperingResult } from '@repo/shared';

export type ClearNotificationMessage = {
	notificationId: string;
};
export type ClearNotificationResult = WhisperingResult<void>;

async function clearNotification(
	notificationId: string,
): Promise<WhisperingResult<void>> {
	const { error: clearError } = trySync({
		try: () => chrome.notifications.clear(notificationId),
		mapErr: (error) =>
			WhisperingError({
				title: 'Error invoking clearNotification command',
				description:
					'There was an error clearing the notification in the background service worker.',
				action: { type: 'more-details', error },
			}),
	});
	if (clearError) return Err(clearError);
	return Ok(undefined);
}

const handler: PlasmoMessaging.MessageHandler<
	ClearNotificationMessage,
	ClearNotificationResult
> = async ({ body }, res) => {
	if (!body?.notificationId) {
		res.send(
			Err(
				WhisperingError({
					title: 'Error invoking clearNotification command',
					description:
						'ClearNotification must be provided notificationId in the request body of the message',
				}),
			),
		);
		return;
	}
	res.send(await clearNotification(body.notificationId));
};

export default handler;
