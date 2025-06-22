import type { Result, TaggedError } from '@epicenterhq/result';
import type { WhisperingSoundNames } from '$lib/constants';

export type PlaySoundServiceError = TaggedError<'PlaySoundServiceError'>;

export type PlaySoundService = {
	playSound: (
		soundName: WhisperingSoundNames,
	) => Promise<Result<void, PlaySoundServiceError>>;
};
