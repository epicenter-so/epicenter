import { tryAsync } from '@epicenterhq/result';
import type { PlaySoundService, PlaySoundServiceError } from './_types';
import { audioElements } from './_audioElements';

export function createPlaySoundServiceDesktop(): PlaySoundService {
	return {
		playSound: async (soundName) =>
			tryAsync({
				try: async () => {
					await audioElements[soundName].play();
				},
				mapError: (error): PlaySoundServiceError => ({
					name: 'PlaySoundServiceError',
					message: 'Failed to play sound',
					context: { soundName },
					cause: error,
				}),
			}),
	};
}
