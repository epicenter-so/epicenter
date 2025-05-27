import { Err, Ok } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	WhisperingError,
	type WhisperingResult,
	parseJson,
} from '@repo/shared';
import { type Settings, settingsSchema } from '@repo/shared/settings';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';
import type { WhisperingStorageKey } from '~lib/storage';

export type GetSettingsResponse = WhisperingResult<Settings>;

const getSettings = async () => {
	const { data: whisperingTabId, error: getWhisperingTabIdError } =
		await getOrCreateWhisperingTabId();
	if (getWhisperingTabIdError) return Err(getWhisperingTabIdError);

	const { data: valueFromStorage, error: injectScriptError } =
		await injectScript<string | null, [WhisperingStorageKey]>({
			tabId: whisperingTabId,
			commandName: 'getSettings',
			func: (settingsKey) => {
				try {
					const valueFromStorage = localStorage.getItem(settingsKey);
					return { data: valueFromStorage, error: null } as const;
				} catch (error) {
					return {
						data: null,
						error: {
							_tag: 'WhisperingError',
							variant: 'error',
							title: 'Unable to get Whispering settings',
							description:
								'There was an error getting the Whispering settings from localStorage.',
							action: {
								type: 'more-details',
								error,
							},
						},
					} as const;
				}
			},
			args: ['whispering-settings'],
		});
	if (injectScriptError) return Err(injectScriptError);

	if (valueFromStorage === null) {
		return Err(
			WhisperingError({
				title: 'Whispering settings not found',
				description: 'Local storage does not contain Whispering settings.',
			}),
		);
	}

	const parseJsonResult = parseJson(valueFromStorage);
	if (parseJsonResult.error)
		return Err(
			WhisperingError({
				title: 'Unable to parse Whispering settings',
				description:
					'There was an error parsing the Whispering settings from localStorage with JSON.parse.',
			}),
		);
	const maybeSettings = parseJsonResult.data;

	const parseResult = settingsSchema.safeParse(maybeSettings);
	if (!parseResult.success) {
		return Err(
			WhisperingError({
				title: 'Unable to parse Whispering settings',
				description:
					'There was an error running Schema.parseJson on the Whispering settings fetched from localStorage.',
				action: {
					type: 'more-details',
					error: parseResult.error,
				},
			}),
		);
	}
	const settings = parseResult.data;
	return Ok(settings);
};

const handler: PlasmoMessaging.MessageHandler<
	never,
	GetSettingsResponse
> = async (_req, res) => {
	res.send(await getSettings());
};

export default handler;
