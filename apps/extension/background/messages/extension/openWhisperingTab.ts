import { Err, Ok } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';
import { WhisperingError } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';

export async function openWhisperingTab(
	{ path }: OpenWhisperingTabMessage | undefined = { path: undefined },
): Promise<WhisperingResult<void>> {
	const { data: whisperingTabId, error: getOrCreateWhisperingTabIdError } =
		await getOrCreateWhisperingTabId();
	if (getOrCreateWhisperingTabIdError)
		return Err(getOrCreateWhisperingTabIdError);
	if (!whisperingTabId)
		return Err(
			WhisperingError({
				title: 'Whispering tab not found',
				description: 'The Whispering tab was not found.',
			}),
		);
	await chrome.tabs.update(whisperingTabId, { active: true });
	if (path) {
		const { data: injectScriptResult, error: injectScriptError } =
			await injectScript<undefined, [string]>({
				tabId: whisperingTabId,
				commandName: 'goto',
				func: (route) => {
					try {
						window.goto(route);
						return { data: undefined, error: null } as const;
					} catch (error) {
						return {
							data: null,
							error: {
								_tag: 'WhisperingError',
								variant: 'error',
								title: `Unable to go to route ${route} in Whispering tab`,
								description:
									'There was an error going to the route in the Whispering tab.',
								action: {
									type: 'more-details',
									error,
								},
							},
						} as const;
					}
				},
				args: [path],
			});
		if (injectScriptError) return Err(injectScriptError);
	}
	return Ok(undefined);
}

export type OpenWhisperingTabMessage = {
	path?: string;
};
export type OpenWhisperingTabResult = WhisperingResult<void>;

const handler: PlasmoMessaging.MessageHandler<
	OpenWhisperingTabMessage,
	OpenWhisperingTabResult
> = async ({ body }, res) => {
	res.send(await openWhisperingTab(body));
};

export default handler;
