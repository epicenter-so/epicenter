import { sendToBackground } from '@plasmohq/messaging';
import type { WhisperingErr } from '@repo/shared';
import type { Settings } from '@repo/shared/src/settings';
import type { CancelRecordingResponse } from '~background/messages/app/cancelRecording';
import type { CloseRecordingSessionResponse } from '~background/messages/app/closeRecordingSessionWithToast';
import type { GetSettingsResponse } from '~background/messages/app/getSettings';
import type {
	SetSettingsRequest,
	SetSettingsResponse,
} from '~background/messages/app/setSettings';
import type { ToggleRecordingResponse } from '~background/messages/app/toggleRecording';

export const app = {
	getSettings: async () => {
		const response = (await sendToBackground({
			name: 'app/getSettings',
		})) as GetSettingsResponse;
		return response;
	},
	setSettings: async (settings: Settings) => {
		const response = (await sendToBackground({
			name: 'app/setSettings',
			body: { settings } satisfies SetSettingsRequest,
		})) as SetSettingsResponse;
		return response;
	},
	toggleRecording: async () => {
		const response = (await sendToBackground({
			name: 'app/toggleRecording',
		})) as ToggleRecordingResponse;
		if (!response.ok) {
			return WhisperingErr({
				title: 'Unable to toggle recording via background service worker',
				description:
					'There was likely an issue sending the message to the background service worker from the popup.',
				action: { type: 'more-details', error: response.error },
			});
		}
		return response;
	},
	cancelRecording: async () => {
		const response = (await sendToBackground({
			name: 'app/cancelRecording',
		})) as CancelRecordingResponse;
		if (!response.ok) {
			return WhisperingErr({
				title: 'Unable to cancel recording via background service worker',
				description:
					'There was likely an issue sending the message to the background service worker from the popup.',
				action: { type: 'more-details', error: response.error },
			});
		}
		return response;
	},
	closeRecordingSessionWithToast: async () => {
		const response = (await sendToBackground({
			name: 'app/closeRecordingSessionWithToast',
		})) as CloseRecordingSessionResponse;
		return response;
	},
};
