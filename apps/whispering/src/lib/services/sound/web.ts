import { Ok } from 'wellcrafted/result';
// import { extension } from '@repo/extension';
import type { PlaySoundService } from '.';
import { audioElements, updateAudioSource } from './assets';
import { settings } from '$lib/stores/settings.svelte';

export function createPlaySoundServiceWeb(): PlaySoundService {
	return {
		playSound: async (soundName) => {
			if (!document.hidden) {
				// Update audio source if custom sound is set
				const customSrc = settings.value[`sound.custom.${soundName}` as keyof typeof settings.value] as string;
				updateAudioSource(soundName, customSrc);
				
				const audioElement = audioElements[soundName];
				// Apply individual volume setting for this specific sound
				const individualVolume = settings.value[`sound.volume.${soundName}` as keyof typeof settings.value] as number;
				audioElement.volume = individualVolume ?? 0.5;
				await audioElement.play();
				return Ok(undefined);
			}
			// const { error: playSoundError } = await extension.playSound({
			// 	sound: soundName,
			// });
			// if (playSoundError) {
			// 	return PlaySoundServiceErr(
			// 		`We encountered an issue while playing the ${soundName} sound`,
			// 		{
			// 			context: { soundName },
			// 			cause: playSoundError,
			// 		}
			// 	);
			// }
			return Ok(undefined);
		},
	};
}
