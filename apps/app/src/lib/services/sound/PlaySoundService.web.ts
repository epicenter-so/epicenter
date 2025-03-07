import { Ok } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import { WhisperingErr } from '@repo/shared';
import type { PlaySoundService } from './PlaySoundService';
import { audioElements } from './audioElements';

export function createPlaySoundServiceWeb(): PlaySoundService {
	return {
		playSound: async (soundName) => {
			if (!document.hidden) {
				await audioElements[soundName].play();
				return Ok(undefined);
			}
			const playSoundResult = await extension.playSound({ sound: soundName });
			if (!playSoundResult.ok) {
				return WhisperingErr({
					title: '❌ Failed to Play Sound',
					description: `We encountered an issue while playing the ${soundName} sound`,
					action: {
						type: 'more-details',
						error: playSoundResult.error,
					},
				});
			}
			return Ok(undefined);
		},
	};
}
