import { Ok } from '@epicenterhq/result';
import type { PlaySoundService } from './PlaySoundService';
import { sounds } from './soundsMap';

export function createPlaySoundServiceDesktop(): PlaySoundService {
	return {
		playSound: async (soundName) => {
			await sounds[soundName].play();
			return Ok(undefined);
		},
	};
}
