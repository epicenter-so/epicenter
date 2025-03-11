import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';

export type ToggleRecordingResponse = WhisperingResult<void>;

export const toggleRecording = async () => {
	const whisperingTabIdResult = await getOrCreateWhisperingTabId();
	if (!whisperingTabIdResult.ok) return whisperingTabIdResult;
	const whisperingTabId = whisperingTabIdResult.data;
	return await injectScript<undefined, []>({
		tabId: whisperingTabId,
		commandName: 'toggleRecording',
		func: () => {
			try {
				window.commands.toggleManualRecording();
				return { ok: true, data: undefined } as const;
			} catch (error) {
				return {
					ok: false,
					error: {
						_tag: 'WhisperingError',
						variant: 'error',
						title: 'Unable to toggle recording',
						description:
							'There was an error toggling the recording. Please try again.',
						action: {
							type: 'more-details',
							error,
						},
					},
				} as const;
			}
		},
		args: [],
	});
};

const handler: PlasmoMessaging.MessageHandler<
	never,
	ToggleRecordingResponse
> = async (_req, res) => {
	res.send(await toggleRecording());
};

export default handler;
