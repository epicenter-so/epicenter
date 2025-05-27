import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';
import { Err } from '@epicenterhq/result';

export type ToggleRecordingResponse = WhisperingResult<void>;

export const toggleRecording = async () => {
	const { data: whisperingTabId, error: getOrCreateWhisperingTabIdError } =
		await getOrCreateWhisperingTabId();
	if (getOrCreateWhisperingTabIdError)
		return Err(getOrCreateWhisperingTabIdError);
	return await injectScript<undefined, []>({
		tabId: whisperingTabId,
		commandName: 'toggleRecording',
		func: () => {
			try {
				window.commands.toggleManualRecording();
				return { data: undefined, error: null } as const;
			} catch (error) {
				return {
					data: null,
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
