import { Err, Ok } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	WhisperingError,
	type WhisperingResult,
	type WhisperingSoundNames,
} from '@repo/shared';
import { getActiveTabId } from '~lib/getActiveTabId';

export type PlaySoundMessage = {
	sound: WhisperingSoundNames;
};
export type PlaySoundResult = WhisperingResult<undefined>;

const playSound = async (sound: WhisperingSoundNames) => {
	console.info('Playing sound', sound);
	const { data: activeTabId, error: getActiveTabIdError } =
		await getActiveTabId();
	if (getActiveTabIdError) {
		return Err(
			WhisperingError({
				title: 'Failed to get active tab ID',
				description: 'Failed to get active tab ID to play sound',
				action: { type: 'more-details', error: getActiveTabIdError },
			}),
		);
	}
	if (!activeTabId) {
		return Err(
			WhisperingError({
				title: 'Failed to get active tab ID',
				description: 'Failed to get active tab ID to play sound',
			}),
		);
	}
	const sendMessageResult = await chrome.tabs.sendMessage(activeTabId, {
		message: 'playSound',
		sound,
	});
	if (!sendMessageResult) {
		return Err(
			WhisperingError({
				title: `Failed to play ${sound} sound`,
				description: `Failed to play ${sound} sound in active tab ${activeTabId}`,
				action: { type: 'more-details', error: sendMessageResult },
			}),
		);
	}
	return Ok(undefined);
};

const handler: PlasmoMessaging.MessageHandler<
	PlaySoundMessage,
	PlaySoundResult
> = async ({ body }, res) => {
	if (!body?.sound) {
		res.send(
			Err(
				WhisperingError({
					title: 'Error invoking playSound command',
					description:
						'Sound must be provided in the request body of the message',
				}),
			),
		);
		return;
	}
	res.send(await playSound(body.sound));
};

export default handler;
