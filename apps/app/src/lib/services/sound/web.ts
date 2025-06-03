import { Err, Ok } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import type { PlaySoundService } from './_types';
import { audioElements } from './_audioElements';

export function createPlaySoundServiceWeb(): PlaySoundService {
	return {
		playSound: async (soundName) => {
			if (!document.hidden) {
				await audioElements[soundName].play();
				return Ok(undefined);
			}
			const { error: playSoundError } = await extension.playSound({
				sound: soundName,
			});
			if (playSoundError) {
				return Err({
					name: 'PlaySoundServiceError',
					message: `We encountered an issue while playing the ${soundName} sound`,
					context: { soundName },
					cause: playSoundError,
				});
			}
			return Ok(undefined);
		},
	};
}
