import { DeepgramTranscriptionServiceLive } from '$lib/services/transcription/deepgram';
import { ElevenlabsTranscriptionServiceLive } from '$lib/services/transcription/elevenlabs';
import { GroqTranscriptionServiceLive } from '$lib/services/transcription/groq';
import { OpenaiTranscriptionServiceLive } from '$lib/services/transcription/openai';
import { SpeachesTranscriptionServiceLive } from '$lib/services/transcription/speaches';
import { WhisperCppTranscriptionServiceLive } from '$lib/services/transcription/whispercpp';

export {
	ElevenlabsTranscriptionServiceLive as elevenlabs,
	GroqTranscriptionServiceLive as groq,
	OpenaiTranscriptionServiceLive as openai,
	SpeachesTranscriptionServiceLive as speaches,
	DeepgramTranscriptionServiceLive as deepgram,
	WhisperCppTranscriptionServiceLive as whispercpp,
};

export type { ElevenLabsTranscriptionService } from './elevenlabs';
export type { GroqTranscriptionService } from './groq';
export type { OpenaiTranscriptionService } from './openai';
export type { SpeachesTranscriptionService } from './speaches';
export type { DeepgramTranscriptionService } from './deepgram';
export type { WhisperCppTranscriptionService } from './whispercpp';
