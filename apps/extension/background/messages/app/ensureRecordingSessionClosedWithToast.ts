import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';
import { Err } from '~node_modules/@epicenterhq/result/dist';

export type CloseRecordingSessionResponse = WhisperingResult<void>;

const closeRecordingSession = async () => {
	const { data: whisperingTabId, error: getOrCreateWhisperingTabIdError } =
		await getOrCreateWhisperingTabId();
	if (getOrCreateWhisperingTabIdError)
		return Err(getOrCreateWhisperingTabIdError);
	return await injectScript<undefined, []>({
		tabId: whisperingTabId,
		commandName: 'closeRecordingSession',
		func: () => {
			try {
				window.commands.closeManualRecordingSession();
				return { data: undefined, error: null } as const;
			} catch (error) {
				return {
					data: null,
					error: {
						_tag: 'WhisperingError',
						variant: 'error',
						title: 'Unable to close recording session',
						description:
							'There was an error closing the recording session. Please try again.',
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
	CloseRecordingSessionResponse
> = async (req, res) => {
	res.send(await closeRecordingSession());
};

export default handler;
