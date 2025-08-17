import { DeepgramTranscriptionServiceLive } from './deepgram';
import { ElevenlabsTranscriptionServiceLive } from './elevenlabs';
import { GroqTranscriptionServiceLive } from './groq';
import { OpenaiTranscriptionServiceLive } from './openai';
import { OwhisperTranscriptionServiceLive } from './owhisper';
import { SpeachesTranscriptionServiceLive } from './speaches';
import { WhisperCppTranscriptionServiceLive } from './whispercpp';

export {
	ElevenlabsTranscriptionServiceLive as elevenlabs,
	GroqTranscriptionServiceLive as groq,
	OpenaiTranscriptionServiceLive as openai,
	OwhisperTranscriptionServiceLive as owhisper,
	SpeachesTranscriptionServiceLive as speaches,
	DeepgramTranscriptionServiceLive as deepgram,
	WhisperCppTranscriptionServiceLive as whispercpp,
};

export type { ElevenLabsTranscriptionService } from './elevenlabs';
export type { GroqTranscriptionService } from './groq';
export type { OpenaiTranscriptionService } from './openai';
export type { OwhisperTranscriptionService } from './owhisper';
export type { SpeachesTranscriptionService } from './speaches';
export type { DeepgramTranscriptionService } from './deepgram';
export type { WhisperCppTranscriptionService } from './whispercpp';