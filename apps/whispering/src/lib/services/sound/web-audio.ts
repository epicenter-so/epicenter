import { tryAsync } from 'wellcrafted/result';
import type { PlaySoundService } from '.';
import { PlaySoundServiceErr } from './types';
import {
	default as captureVadSoundSrc,
	default as stopManualSoundSrc,
} from './assets/sound_ex_machina_Button_Blip.mp3';
import startManualSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import stopVadSoundSrc from './assets/zapsplat_household_alarm_clock_large_snooze_button_press_001_12968.mp3';
import startVadSoundSrc from './assets/zapsplat_household_alarm_clock_large_snooze_button_press_002_12969.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import transformationCompleteSoundSrc from './assets/zapsplat_multimedia_notification_alert_ping_bright_chime_001_93276.mp3';
import transcriptionCompleteSoundSrc from './assets/zapsplat_multimedia_ui_notification_classic_bell_synth_success_107505.mp3';

// Map sound names to their source files
const soundSources = {
	'manual-start': startManualSoundSrc,
	'manual-cancel': cancelSoundSrc,
	'manual-stop': stopManualSoundSrc,
	'vad-start': startVadSoundSrc,
	'vad-capture': captureVadSoundSrc,
	'vad-stop': stopVadSoundSrc,
	transcriptionComplete: transcriptionCompleteSoundSrc,
	transformationComplete: transformationCompleteSoundSrc,
} as const;

// Create a single AudioContext for all sounds
let audioContext: AudioContext | null = null;

// Cache for decoded audio buffers
const audioBufferCache = new Map<string, AudioBuffer>();

// Initialize the audio context (required for user interaction)
function getAudioContext(): AudioContext {
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	return audioContext;
}

// Load and decode an audio file
async function loadAudioBuffer(audioSrc: string): Promise<AudioBuffer> {
	// Check cache first
	if (audioBufferCache.has(audioSrc)) {
		return audioBufferCache.get(audioSrc)!;
	}

	const context = getAudioContext();
	
	// Fetch the audio file
	const response = await fetch(audioSrc);
	if (!response.ok) {
		throw new Error(`Failed to fetch audio: ${response.statusText}`);
	}
	
	const arrayBuffer = await response.arrayBuffer();
	const audioBuffer = await context.decodeAudioData(arrayBuffer);
	
	// Cache the decoded buffer
	audioBufferCache.set(audioSrc, audioBuffer);
	
	return audioBuffer;
}

// Play a sound using Web Audio API (doesn't register with media controls)
async function playSoundWithWebAudio(audioSrc: string): Promise<void> {
	const context = getAudioContext();
	
	// Resume context if suspended (required for user interaction)
	if (context.state === 'suspended') {
		await context.resume();
	}
	
	// Load the audio buffer
	const audioBuffer = await loadAudioBuffer(audioSrc);
	
	// Create and play the sound
	const source = context.createBufferSource();
	source.buffer = audioBuffer;
	source.connect(context.destination);
	source.start();
}

export function createPlaySoundServiceWebAudio(): PlaySoundService {
	return {
		playSound: async (soundName) =>
			tryAsync({
				try: async () => {
					const audioSrc = soundSources[soundName];
					if (!audioSrc) {
						throw new Error(`Unknown sound: ${soundName}`);
					}
					
					await playSoundWithWebAudio(audioSrc);
				},
				mapErr: (error) =>
					PlaySoundServiceErr({
						message: 'Failed to play sound with Web Audio API',
						context: { soundName },
						cause: error,
					}),
			}),
	};
}
