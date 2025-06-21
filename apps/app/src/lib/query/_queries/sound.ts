import { services } from '$lib/services';
import type { PlaySoundServiceError } from '$lib/services/sound/_types';
import { settings } from '$lib/stores/settings.svelte';
import { Ok, type Result } from '@epicenterhq/result';
import type { WhisperingSoundNames } from '$lib/constants';
import { defineMutation } from '../_utils';

const soundKeys = {
	all: ['sound'] as const,
	playSoundIfEnabled: ['sound', 'playSoundIfEnabled'] as const,
} as const;

export const sound = {
	playSoundIfEnabled: defineMutation({
		mutationKey: soundKeys.playSoundIfEnabled,
		resultMutationFn: async (
			soundName: WhisperingSoundNames,
		): Promise<Result<void, PlaySoundServiceError>> => {
			if (!settings.value[`sound.playOn.${soundName}`]) {
				return Ok(undefined);
			}
			return await services.sound.playSound(soundName);
		},
	}),
};
