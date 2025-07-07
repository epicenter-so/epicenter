import type { Result } from 'wellcrafted/result';
import { createTaggedError } from 'wellcrafted/error';
import type { WhisperingSoundNames } from '$lib/constants/sounds';

const { PlaySoundServiceError, PlaySoundServiceErr } =
	createTaggedError('PlaySoundServiceError');
export type PlaySoundServiceError = ReturnType<typeof PlaySoundServiceError>;
export { PlaySoundServiceError, PlaySoundServiceErr };

export type PlaySoundService = {
	playSound: (
		soundName: WhisperingSoundNames,
	) => Promise<Result<void, PlaySoundServiceError>>;
};
