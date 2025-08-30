import { tryAsync } from 'wellcrafted/result';

import type { PlaySoundService } from '.';

import { audioElements } from './assets';
import { PlaySoundServiceErr } from './types';

export function createPlaySoundServiceDesktop(): PlaySoundService {
	return {
		playSound: async (soundName) =>
			tryAsync({
				mapErr: (error) =>
					PlaySoundServiceErr({
						cause: error,
						context: { soundName },
						message: 'Failed to play sound',
					}),
				try: async () => {
					await audioElements[soundName].play();
				},
			}),
	};
}
