import type { WhisperingSoundNames } from '$lib/constants/sounds';
import type { PlaySoundServiceError } from '$lib/services/sound';

import * as services from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { Ok, type Result } from 'wellcrafted/result';

import { defineMutation } from './_client';

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
