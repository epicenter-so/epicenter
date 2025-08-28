import { tryAsync } from 'wellcrafted/result';
import type { PlaySoundService } from '.';
import { PlaySoundServiceErr } from './types';
import { audioElements } from './assets';

// Map sound names to their source files using existing audioElements
const soundSources = {
	'manual-start': audioElements['manual-start'].src,
	'manual-cancel': audioElements['manual-cancel'].src,
	'manual-stop': audioElements['manual-stop'].src,
	'vad-start': audioElements['vad-start'].src,
	'vad-capture': audioElements['vad-capture'].src,
	'vad-stop': audioElements['vad-stop'].src,
	transcriptionComplete: audioElements.transcriptionComplete.src,
	transformationComplete: audioElements.transformationComplete.src,
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
