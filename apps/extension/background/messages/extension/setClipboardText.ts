import type { PlasmoMessaging } from '@plasmohq/messaging';
import { WhisperingError, type WhisperingResult } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getActiveTabId } from '~lib/getActiveTabId';
import { whisperingStorage } from '~lib/storage';
import { Err } from '@epicenterhq/result';

export type SetClipboardTextMessage = {
	transcribedText: string;
};

export type SetClipboardTextResult = WhisperingResult<string>;

const setClipboardText = async (
	transcribedText: string,
): Promise<SetClipboardTextResult> => {
	const { data: activeTabId, error: getActiveTabIdError } =
		await getActiveTabId();
	if (getActiveTabIdError) {
		return Err(
			WhisperingError({
				title: 'Unable to copy transcribed text to clipboard',
				description:
					'Please go to your recordings tab in the Whispering website to copy the transcribed text to clipboard',
				action: { type: 'more-details', error: getActiveTabIdError },
			}),
		);
	}
	if (!activeTabId) {
		return Err(
			WhisperingError({
				title: 'Unable to copy transcribed text to clipboard',
				description: 'No active tab ID found',
			}),
		);
	}

	whisperingStorage.setLatestRecordingTranscribedText(transcribedText);

	const injectScriptResult = await injectScript<string, [string]>({
		tabId: activeTabId,
		commandName: 'setClipboardText',
		func: (text) => {
			try {
				navigator.clipboard.writeText(text);
				return { data: text, error: null } as const;
			} catch (error) {
				return {
					data: null,
					error: {
						_tag: 'WhisperingError',
						variant: 'error',
						title: 'Unable to copy transcribed text to clipboard in active tab',
						description:
							'There was an error writing to the clipboard using the browser Clipboard API. Please try again.',
						action: { type: 'more-details', error },
					},
				} as const;
			}
		},
		args: [transcribedText],
	});
	return injectScriptResult;
};

const handler: PlasmoMessaging.MessageHandler<
	SetClipboardTextMessage,
	SetClipboardTextResult
> = async ({ body }, res) => {
	if (!body?.transcribedText) {
		res.send(
			Err(
				WhisperingError({
					title: 'Unable to copy transcribed text to clipboard',
					description:
						'Text must be provided in the request body of the message',
				}),
			),
		);
		return;
	}
	res.send(await setClipboardText(body.transcribedText));
};
export default handler;
