import type { PlasmoMessaging } from '@plasmohq/messaging';
import { WhisperingError, type WhisperingResult } from '@repo/shared';
import type { Settings } from '@repo/shared/settings';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';
import type { WhisperingStorageKey } from '~lib/storage';
import { Err } from '~node_modules/@epicenterhq/result/dist';

export type SetSettingsRequest = {
	settings: Settings;
};
export type SetSettingsResponse = WhisperingResult<Settings>;

const setSettings = async (settings: Settings) => {
	const { data: whisperingTabId, error: getOrCreateWhisperingTabIdError } =
		await getOrCreateWhisperingTabId();
	if (getOrCreateWhisperingTabIdError)
		return Err(getOrCreateWhisperingTabIdError);
	const returnedSettings = await injectScript<
		Settings,
		[WhisperingStorageKey, Settings]
	>({
		tabId: whisperingTabId,
		commandName: 'setSettings',
		func: (settingsKey, settings) => {
			try {
				localStorage.setItem(settingsKey, JSON.stringify(settings));
				return { data: settings, error: null } as const;
			} catch (error) {
				return {
					data: null,
					error: {
						_tag: 'WhisperingError',
						variant: 'error',
						title: 'Unable to set Whispering settings',
						description: 'An error occurred while setting Whispering settings.',
						action: {
							type: 'more-details',
							error,
						},
					},
				} as const;
			}
		},
		args: ['whispering-settings', settings],
	});
	return returnedSettings;
};

const handler: PlasmoMessaging.MessageHandler<
	SetSettingsRequest,
	SetSettingsResponse
> = async ({ body }, res) => {
	if (!body?.settings) {
		res.send(
			Err(
				WhisperingError({
					title: 'Error setting Whispering settings',
					description: 'Settings must be provided in the message request body',
				}),
			),
		);
		return;
	}
	res.send(await setSettings(body.settings));
};

export default handler;
