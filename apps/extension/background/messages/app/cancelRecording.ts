import { Err } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';

export type CancelRecordingResponse = WhisperingResult<void>;

const cancelRecording = async () => {
	const { data: whisperingTabId, error: getOrCreateWhisperingTabIdError } =
		await getOrCreateWhisperingTabId();
	if (getOrCreateWhisperingTabIdError)
		return Err(getOrCreateWhisperingTabIdError);
	return await injectScript<undefined, []>({
		tabId: whisperingTabId,
		commandName: 'cancelRecording',
		func: () => {
			try {
				window.commands.cancelManualRecording();
				return { data: undefined, error: null } as const;
			} catch (error) {
				return {
					data: null,
					error: {
						_tag: 'WhisperingError',
						variant: 'error',
						title: 'Unable to cancel recording',
						description:
							'There was an error canceling the recording. Please try again.',
						action: { type: 'more-details', error },
					},
				} as const;
			}
		},
		args: [],
	});
};

const handler: PlasmoMessaging.MessageHandler<
	undefined,
	CancelRecordingResponse
> = async (req, res) => {
	res.send(await cancelRecording());
};

export default handler;
