import type { WhisperingSoundNames } from '$lib/constants/sounds';
import type { Result } from 'wellcrafted/result';

import { createTaggedError } from 'wellcrafted/error';

export const { PlaySoundServiceErr, PlaySoundServiceError } = createTaggedError(
	'PlaySoundServiceError',
);
export type PlaySoundService = {
	playSound: (
		soundName: WhisperingSoundNames,
	) => Promise<Result<void, PlaySoundServiceError>>;
};

export type PlaySoundServiceError = ReturnType<typeof PlaySoundServiceError>;
