import { tryAsync } from 'wellcrafted/result';
import type { PlaySoundService } from '.';
import { audioElements } from './assets';
import { PlaySoundServiceError } from './types';

export function createPlaySoundServiceDesktop(): PlaySoundService {
	return {
		playSound: async (soundName) =>
			tryAsync({
				try: async () => {
					await audioElements[soundName].play();
				},
				mapError: (error) =>
					PlaySoundServiceError({
						message: 'Failed to play sound',
						context: { soundName },
						cause: error,
					}),
			}),
	};
}
