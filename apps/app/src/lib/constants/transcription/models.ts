/**
 * Transcription model constants for all providers
 */

export const OPENAI_TRANSCRIPTION_MODELS = [
	'whisper-1',
	'gpt-4o-transcribe',
	'gpt-4o-mini-transcribe',
] as const;

export const GROQ_MODELS = [
	/**
	 * Best accuracy (10.3% WER) and full multilingual support, including translation.
	 * Recommended for error-sensitive applications requiring multilingual support.
	 * Cost: $0.111/hour
	 */
	'whisper-large-v3',
	/**
	 * Fast multilingual model with good accuracy (12% WER).
	 * Best price-to-performance ratio for multilingual applications.
	 * Cost: $0.04/hour, 216x real-time processing
	 */
	'whisper-large-v3-turbo',
	/**
	 * Fastest and most cost-effective model, but English-only.
	 * Recommended for English transcription where speed and cost are priorities.
	 * Cost: $0.02/hour, 250x real-time processing, 13% WER
	 */
	'distil-whisper-large-v3-en',
] as const;

export type GroqModel = (typeof GROQ_MODELS)[number];

export const ELEVENLABS_TRANSCRIPTION_MODELS = [
	'scribe_v1',
	'scribe_v1_experimental',
] as const;

export type ElevenLabsModel = (typeof ELEVENLABS_TRANSCRIPTION_MODELS)[number];