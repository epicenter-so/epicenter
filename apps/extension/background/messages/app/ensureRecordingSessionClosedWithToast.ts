import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';

export type CloseRecordingSessionResponse = WhisperingResult<void>;

const closeRecordingSession = async () => {
	const whisperingTabIdResult = await getOrCreateWhisperingTabId();
	if (!whisperingTabIdResult.ok) return whisperingTabIdResult;
	const whisperingTabId = whisperingTabIdResult.data;
	return await injectScript<undefined, []>({
		tabId: whisperingTabId,
		commandName: 'closeRecordingSession',
		func: () => {
			try {
				window.commands.closeManualRecordingSession();
				return { ok: true, data: undefined } as const;
			} catch (error) {
				return {
					ok: false,
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
