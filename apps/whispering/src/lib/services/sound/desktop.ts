import { tryAsync } from 'wellcrafted/result';
import type { PlaySoundService } from '.';
import { audioElements, updateAudioSource } from './assets';
import { PlaySoundServiceErr } from './types';
import { settings } from '$lib/stores/settings.svelte';

export function createPlaySoundServiceDesktop(): PlaySoundService {
	return {
		playSound: async (soundName) =>
			tryAsync({
				try: async () => {
					// Update audio source if custom sound is set
					const customSrc = settings.value[`sound.custom.${soundName}` as keyof typeof settings.value] as string;
					updateAudioSource(soundName, customSrc);
					
					const audioElement = audioElements[soundName];
					// Apply individual volume setting for this specific sound
					const individualVolume = settings.value[`sound.volume.${soundName}` as keyof typeof settings.value] as number;
					audioElement.volume = individualVolume ?? 0.5;
					await audioElement.play();
				},
				mapErr: (error) =>
					PlaySoundServiceErr({
						message: 'Failed to play sound',
						context: { soundName },
						cause: error,
					}),
			}),
	};
}
