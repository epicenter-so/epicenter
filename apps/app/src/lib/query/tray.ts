import type { WhisperingRecordingState } from '$lib/constants/audio';
import { WhisperingErr, type WhisperingError } from '$lib/result';
import * as services from '$lib/services';
import { Ok, type Result } from 'wellcrafted/result';
import { defineMutation } from './_client';

const setTrayIconKeys = {
	setTrayIcon: ['setTrayIcon', 'setTrayIcon'] as const,
};

export const tray = {
	setTrayIcon: defineMutation({
		mutationKey: setTrayIconKeys.setTrayIcon,
		resultMutationFn: async ({
			icon,
		}: {
			icon: WhisperingRecordingState;
		}): Promise<Result<void, WhisperingError>> => {
			const { data, error } = await services.tray.setTrayIcon(icon);

			if (error) {
				return WhisperingErr({
					title: '⚠️ Failed to set tray icon',
					description: error.message,
					action: { type: 'more-details', error },
				});
			}

			return Ok(data);
		},
	}),
};
