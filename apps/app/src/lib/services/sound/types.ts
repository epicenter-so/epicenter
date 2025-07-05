import type { Result } from 'wellcrafted/result';
import type { TaggedError } from 'wellcrafted/error';
import type { WhisperingSoundNames } from '$lib/constants/sounds';

export type PlaySoundServiceError = TaggedError<'PlaySoundServiceError'>;

export type PlaySoundService = {
	playSound: (
		soundName: WhisperingSoundNames,
	) => Promise<Result<void, PlaySoundServiceError>>;
};
