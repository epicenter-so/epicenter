import { Err, Ok } from '@epicenterhq/result';
import { sendToBackground } from '@plasmohq/messaging';
import { WhisperingError } from '@repo/shared';
import type { Settings } from '@repo/shared/settings';
import type { CancelRecordingResponse } from '~background/messages/app/cancelRecording';
import type { CloseRecordingSessionResponse } from '~background/messages/app/ensureRecordingSessionClosedWithToast';
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
		const { data: toggleRecording, error: toggleRecordingError } =
			(await sendToBackground({
				name: 'app/toggleRecording',
			})) as ToggleRecordingResponse;
		if (toggleRecordingError) {
			return Err(
				WhisperingError({
					title: 'Unable to toggle recording via background service worker',
					description:
						'There was likely an issue sending the message to the background service worker from the popup.',
					action: { type: 'more-details', error: toggleRecordingError },
				}),
			);
		}
		return Ok(toggleRecording);
	},
	cancelRecording: async () => {
		const { data: cancelRecording, error: cancelRecordingError } =
			(await sendToBackground({
				name: 'app/cancelRecording',
			})) as CancelRecordingResponse;
		if (cancelRecordingError) {
			return Err(WhisperingError({
				title: 'Unable to cancel recording via background service worker',
				description:
					'There was likely an issue sending the message to the background service worker from the popup.',
				action: { type: 'more-details', error: cancelRecordingError },
			}));
		}
		return Ok(cancelRecording);
	},
	closeRecordingSessionWithToast: async () => {
		const response = (await sendToBackground({
			name: 'app/closeRecordingSessionWithToast',
		})) as CloseRecordingSessionResponse;
		return response;
	},
};
