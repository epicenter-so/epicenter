import type { WhisperingSoundNames } from '$lib/constants/sounds';
import {
	default as captureVadSoundSrc,
	default as stopManualSoundSrc,
} from './sound_ex_machina_Button_Blip.mp3';
import startManualSoundSrc from './zapsplat_household_alarm_clock_button_press_12967.mp3';
import stopVadSoundSrc from './zapsplat_household_alarm_clock_large_snooze_button_press_001_12968.mp3';
import startVadSoundSrc from './zapsplat_household_alarm_clock_large_snooze_button_press_002_12969.mp3';
import cancelSoundSrc from './zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import transformationCompleteSoundSrc from './zapsplat_multimedia_notification_alert_ping_bright_chime_001_93276.mp3';
import transcriptionCompleteSoundSrc from './zapsplat_multimedia_ui_notification_classic_bell_synth_success_107505.mp3';

const createAudioElement = (src: string): HTMLAudioElement => {
	const audio = new Audio(src);
	// Set default volume - this will be updated dynamically when sounds are played
	audio.volume = 0.5;
	return audio;
};

// Default sound mappings
const defaultSounds = {
	'manual-start': startManualSoundSrc,
	'manual-cancel': cancelSoundSrc,
	'manual-stop': stopManualSoundSrc,
	'cpal-start': startManualSoundSrc,
	'cpal-cancel': cancelSoundSrc,
	'cpal-stop': stopManualSoundSrc,
	'vad-start': startVadSoundSrc,
	'vad-capture': captureVadSoundSrc,
	'vad-stop': stopVadSoundSrc,
	transcriptionComplete: transcriptionCompleteSoundSrc,
	transformationComplete: transformationCompleteSoundSrc,
} satisfies Record<WhisperingSoundNames, string>;

export const audioElements = {
	'manual-start': createAudioElement(defaultSounds['manual-start']),
	'manual-cancel': createAudioElement(defaultSounds['manual-cancel']),
	'manual-stop': createAudioElement(defaultSounds['manual-stop']),
	'cpal-start': createAudioElement(defaultSounds['cpal-start']),
	'cpal-cancel': createAudioElement(defaultSounds['cpal-cancel']),
	'cpal-stop': createAudioElement(defaultSounds['cpal-stop']),
	'vad-start': createAudioElement(defaultSounds['vad-start']),
	'vad-capture': createAudioElement(defaultSounds['vad-capture']),
	'vad-stop': createAudioElement(defaultSounds['vad-stop']),
	transcriptionComplete: createAudioElement(defaultSounds.transcriptionComplete),
	transformationComplete: createAudioElement(defaultSounds.transformationComplete),
} satisfies Record<WhisperingSoundNames, HTMLAudioElement>;

// Function to update audio element source (for custom sounds)
export const updateAudioSource = (soundName: WhisperingSoundNames, customSrc?: string) => {
	const audioElement = audioElements[soundName];
	const newSrc = customSrc && customSrc.length > 0 ? customSrc : defaultSounds[soundName];
	
	if (audioElement.src !== newSrc) {
		audioElement.src = newSrc;
		// Preload the new sound
		audioElement.load();
	}
};
