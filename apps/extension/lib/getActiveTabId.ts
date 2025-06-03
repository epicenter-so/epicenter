import { Err, tryAsync } from '@epicenterhq/result';

export const getActiveTabId = () =>
	tryAsync({
		try: async () => {
			const [activeTab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			return activeTab?.id;
		},
		mapErr: (error) =>
			Err({
				name: 'GetActiveTabIdError',
				message: 'Unable to get active tab ID',
			} as const),
	});
