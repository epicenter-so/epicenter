/**
 * Transcription model constants for all providers
 */

export const OPENAI_TRANSCRIPTION_MODELS = [
	{
		name: 'whisper-1',
		description:
			"OpenAI's flagship speech-to-text model with multilingual support. Reliable and accurate transcription for a wide variety of use cases.",
		cost: '$0.36/hour',
	},
	{
		name: 'gpt-4o-transcribe',
		description:
			'GPT-4o powered transcription with enhanced understanding and context. Best for complex audio requiring deep comprehension.',
		cost: '$0.36/hour',
	},
	{
		name: 'gpt-4o-mini-transcribe',
		description:
			'Cost-effective GPT-4o mini transcription model. Good balance of performance and cost for standard transcription needs.',
		cost: '$0.18/hour',
	},
] as const;

export type OpenAIModel = (typeof OPENAI_TRANSCRIPTION_MODELS)[number];

export const GROQ_MODELS = [
	{
		name: 'whisper-large-v3',
		description:
			'Best accuracy (10.3% WER) and full multilingual support, including translation. Recommended for error-sensitive applications requiring multilingual support.',
		cost: '$0.111/hour',
	},
	{
		name: 'whisper-large-v3-turbo',
		description:
			'Fast multilingual model with good accuracy (12% WER). Best price-to-performance ratio for multilingual applications.',
		cost: '$0.04/hour',
	},
	{
		name: 'distil-whisper-large-v3-en',
		description:
			'Fastest and most cost-effective model, but English-only. Recommended for English transcription where speed and cost are priorities.',
		cost: '$0.02/hour',
	},
] as const;

export type GroqModel = (typeof GROQ_MODELS)[number];

export const ELEVENLABS_TRANSCRIPTION_MODELS = [
	{
		name: 'scribe_v1',
		description:
			"World's most accurate transcription model with 96.7% accuracy for English. Supports 99 languages with word-level timestamps and speaker diarization.",
		cost: '$0.40/hour',
	},
	{
		name: 'scribe_v1_experimental',
		description:
			'Experimental version of Scribe with latest features and improvements. May include cutting-edge capabilities but with potential instability.',
		cost: '$0.40/hour',
	},
] as const;

export type ElevenLabsModel = (typeof ELEVENLABS_TRANSCRIPTION_MODELS)[number];

export type TranscriptionModel = OpenAIModel | GroqModel | ElevenLabsModel;
