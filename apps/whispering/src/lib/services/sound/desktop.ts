import { createPlaySoundServiceWebAudio } from './web-audio';

// Use Web Audio API instead of HTML5 audio elements to avoid media control interference
export const createPlaySoundServiceDesktop = createPlaySoundServiceWebAudio;
