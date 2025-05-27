import { Err, Ok } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import { WhisperingError } from '@repo/shared';
import type { PlaySoundService } from './PlaySoundService';
import { audioElements } from './audioElements';

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
				return Err(
					WhisperingError({
						title: '❌ Failed to Play Sound',
						description: `We encountered an issue while playing the ${soundName} sound`,
						action: {
							type: 'more-details',
							error: playSoundError,
						},
					}),
				);
			}
			return Ok(undefined);
		},
	};
}
