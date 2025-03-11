import { Ok } from '@epicenterhq/result';
import type { PlaySoundService } from './PlaySoundService';
import { audioElements } from './audioElements';

export function createPlaySoundServiceDesktop(): PlaySoundService {
	return {
		playSound: async (soundName) => {
			await audioElements[soundName].play();
			return Ok(undefined);
		},
	};
}
