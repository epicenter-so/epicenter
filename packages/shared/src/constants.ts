import { z } from 'zod';
import { CloudIcon, HexagonIcon, PauseIcon, ServerIcon } from 'lucide-svelte';
import type { Settings } from './settings/index.js';

export const WHISPERING_URL =
	process.env.NODE_ENV === 'production'
		? 'https://whispering.bradenwong.com'
		: 'http://localhost:5173';

export const WHISPERING_URL_WILDCARD = `${WHISPERING_URL}/*` as const;

export const WHISPERING_RECORDINGS_PATHNAME = '/recordings' as const;

export const WHISPERING_SETTINGS_PATHNAME = '/settings' as const;

export const DEBOUNCE_TIME_MS = 500;

export const BITRATE_VALUES_KBPS = [
	'16',
	'32',
	'64',
	'96',
	'128',
	'192',
	'256',
	'320',
] as const;

export const BITRATE_OPTIONS = BITRATE_VALUES_KBPS.map((bitrate) => ({
	label: `${bitrate} kbps`,
	value: bitrate,
}));

export const RECORDING_MODES = ['manual', 'cpal', 'vad', 'live'] as const;
export type RecordingMode = (typeof RECORDING_MODES)[number];
export const RECORDING_MODE_OPTIONS = [
	{ label: 'Manual', value: 'manual', icon: '🎙️', desktopOnly: false },
	{ label: 'CPAL', value: 'cpal', icon: '🔊', desktopOnly: true },
	{ label: 'Voice Activated', value: 'vad', icon: '🎤', desktopOnly: false },
	// { label: 'Live', value: 'live', icon: '🎬', desktopOnly: false },
] as const satisfies {
	label: string;
	value: RecordingMode;
	icon: string;
	desktopOnly: boolean;
}[];

export const DEFAULT_BITRATE_KBPS =
	'128' as const satisfies (typeof BITRATE_VALUES_KBPS)[number];

export const ALWAYS_ON_TOP_VALUES = [
	'Always',
	'When Recording and Transcribing',
	'When Recording',
	'Never',
] as const;

export const ALWAYS_ON_TOP_OPTIONS = ALWAYS_ON_TOP_VALUES.map((option) => ({
	label: option,
	value: option,
}));

export const recordingStateSchema = z.enum(['IDLE', 'RECORDING']);

export type WhisperingRecordingState = z.infer<typeof recordingStateSchema>;

export type CancelRecordingResult =
	| { status: 'cancelled' }
	| { status: 'no-recording' };

export const recorderStateToIcons = {
	IDLE: '🎙️',
	RECORDING: '⏹️',
} as const satisfies Record<WhisperingRecordingState, string>;

export const cpalStateToIcons = {
	IDLE: '🎙️',
	RECORDING: '⏹️',
} as const satisfies Record<WhisperingRecordingState, string>;

export const vadStateSchema = z.enum(['IDLE', 'LISTENING', 'SPEECH_DETECTED']);

export type VadState = z.infer<typeof vadStateSchema>;

export const vadStateToIcons = {
	IDLE: '🎤',
	LISTENING: '💬',
	SPEECH_DETECTED: '👂',
} as const satisfies Record<VadState, string>;

/** Supported languages pulled from OpenAI Website: https://platform.openai.com/docs/guides/speech-to-text/supported-languages */
export const SUPPORTED_LANGUAGES = [
	'auto',
	'af',
	'ar',
	'hy',
	'az',
	'be',
	'bs',
	'bg',
	'ca',
	'zh',
	'hr',
	'cs',
	'da',
	'nl',
	'en',
	'et',
	'fi',
	'fr',
	'gl',
	'de',
	'el',
	'he',
	'hi',
	'hu',
	'is',
	'id',
	'it',
	'ja',
	'kn',
	'kk',
	'ko',
	'lv',
	'lt',
	'mk',
	'ms',
	'mr',
	'mi',
	'ne',
	'no',
	'fa',
	'pl',
	'pt',
	'ro',
	'ru',
	'sr',
	'sk',
	'sl',
	'es',
	'sw',
	'sv',
	'tl',
	'ta',
	'th',
	'tr',
	'uk',
	'ur',
	'vi',
	'cy',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const GROQ_MODELS = [
	'whisper-large-v3',
	'whisper-large-v3-turbo',
	'distil-whisper-large-v3-en',
] as const;

// TODO: Remove this in favor of inline map options
export const GROQ_MODELS_OPTIONS = GROQ_MODELS.map((model) => ({
	value: model,
	label: model,
}));

export const OPENAI_TRANSCRIPTION_MODELS = ['whisper-1'] as const;

export const ELEVENLABS_TRANSCRIPTION_MODELS = ['scribe_v1'] as const;

export const TRANSCRIPTION_SERVICE_IDS = [
	'OpenAI',
	'Groq',
	'faster-whisper-server',
	'ElevenLabs',
] as const;

type TranscriptionServiceId = (typeof TRANSCRIPTION_SERVICE_IDS)[number];

type BaseTranscriptionService = {
	id: TranscriptionServiceId;
	name: string;
	icon: unknown;
};

type ApiTranscriptionService = BaseTranscriptionService & {
	type: 'api';
	models: readonly string[];
	defaultModel: string;
	modelSettingKey: string;
	apiKeyField: keyof Settings;
};

type ServerTranscriptionService = BaseTranscriptionService & {
	type: 'server';
	serverUrlField: keyof Settings;
};

type SatisfiedTranscriptionService =
	| ApiTranscriptionService
	| ServerTranscriptionService;

export const TRANSCRIPTION_SERVICES = [
	{
		id: 'OpenAI',
		name: 'OpenAI Whisper',
		icon: HexagonIcon,
		models: OPENAI_TRANSCRIPTION_MODELS,
		defaultModel: 'whisper-1',
		modelSettingKey: 'transcription.openai.model',
		apiKeyField: 'apiKeys.openai',
		type: 'api',
	},
	{
		id: 'Groq',
		name: 'Groq Whisper',
		icon: CloudIcon,
		models: GROQ_MODELS,
		defaultModel: 'whisper-large-v3',
		modelSettingKey: 'transcription.groq.model',
		apiKeyField: 'apiKeys.groq',
		type: 'api',
	},
	{
		id: 'ElevenLabs',
		name: 'ElevenLabs',
		icon: PauseIcon,
		models: ['scribe_v1'],
		defaultModel: 'scribe_v1',
		modelSettingKey: 'transcription.elevenlabs.model',
		apiKeyField: 'apiKeys.elevenlabs',
		type: 'api',
	},
	{
		id: 'faster-whisper-server',
		name: 'Faster Whisper Server',
		icon: ServerIcon,
		serverUrlField: 'transcription.fasterWhisperServer.serverUrl',
		type: 'server',
	},
] as const satisfies SatisfiedTranscriptionService[];

export const TRANSCRIPTION_SERVICE_OPTIONS = TRANSCRIPTION_SERVICES.map(
	(service) => ({
		label: service.name,
		value: service.id,
	}),
);

export type TranscriptionService = (typeof TRANSCRIPTION_SERVICES)[number];

const SUPPORTED_LANGUAGES_TO_LABEL = {
	auto: 'Auto',
	af: 'Afrikaans',
	ar: 'Arabic',
	hy: 'Armenian',
	az: 'Azerbaijani',
	be: 'Belarusian',
	bs: 'Bosnian',
	bg: 'Bulgarian',
	ca: 'Catalan',
	zh: 'Chinese',
	hr: 'Croatian',
	cs: 'Czech',
	da: 'Danish',
	nl: 'Dutch',
	en: 'English',
	et: 'Estonian',
	fi: 'Finnish',
	fr: 'French',
	gl: 'Galician',
	de: 'German',
	el: 'Greek',
	he: 'Hebrew',
	hi: 'Hindi',
	hu: 'Hungarian',
	is: 'Icelandic',
	id: 'Indonesian',
	it: 'Italian',
	ja: 'Japanese',
	kn: 'Kannada',
	kk: 'Kazakh',
	ko: 'Korean',
	lv: 'Latvian',
	lt: 'Lithuanian',
	mk: 'Macedonian',
	ms: 'Malay',
	mr: 'Marathi',
	mi: 'Maori',
	ne: 'Nepali',
	no: 'Norwegian',
	fa: 'Persian',
	pl: 'Polish',
	pt: 'Portuguese',
	ro: 'Romanian',
	ru: 'Russian',
	sr: 'Serbian',
	sk: 'Slovak',
	sl: 'Slovenian',
	es: 'Spanish',
	sw: 'Swahili',
	sv: 'Swedish',
	tl: 'Tagalog',
	ta: 'Tamil',
	th: 'Thai',
	tr: 'Turkish',
	uk: 'Ukrainian',
	ur: 'Urdu',
	vi: 'Vietnamese',
	cy: 'Welsh',
} as const satisfies Record<SupportedLanguage, string>;

export const SUPPORTED_LANGUAGES_OPTIONS = SUPPORTED_LANGUAGES.map(
	(lang) =>
		({ label: SUPPORTED_LANGUAGES_TO_LABEL[lang], value: lang }) as const,
);

export const INFERENCE_PROVIDERS = [
	'OpenAI',
	'Groq',
	'Anthropic',
	'Google',
] as const;

export const INFERENCE_PROVIDER_OPTIONS = INFERENCE_PROVIDERS.map(
	(provider) => ({
		value: provider,
		label: provider,
	}),
);

// https://platform.openai.com/docs/models
export const OPENAI_INFERENCE_MODELS = [
	'gpt-4o',
	'gpt-4o-mini',
	'gpt-3.5-turbo',
] as const;

export const OPENAI_INFERENCE_MODEL_OPTIONS = OPENAI_INFERENCE_MODELS.map(
	(model) => ({
		value: model,
		label: model,
	}),
);

// https://console.groq.com/docs/models
export const GROQ_INFERENCE_MODELS = ['llama-3.3-70b-versatile'] as const;

export const GROQ_INFERENCE_MODEL_OPTIONS = GROQ_INFERENCE_MODELS.map(
	(model) => ({
		value: model,
		label: model,
	}),
);

// https://docs.anthropic.com/claude/docs/models-overview
export const ANTHROPIC_INFERENCE_MODELS = [
	'claude-3-7-sonnet-latest',
	'claude-3-5-sonnet-latest',
	'claude-3-5-haiku-latest',
	'claude-3-opus-latest',
	'claude-3-sonnet-latest',
	'claude-3-haiku-latest',
] as const;

export const ANTHROPIC_INFERENCE_MODEL_OPTIONS = ANTHROPIC_INFERENCE_MODELS.map(
	(model) => ({
		value: model,
		label: model,
	}),
);

export const GOOGLE_INFERENCE_MODELS = [
	'gemini-2.0-pro',
	'gemini-2.0-flash',
	'gemini-2.0-flash-thinking',
	'gemini-2.0-flash-lite-preview',
] as const;

export const GOOGLE_INFERENCE_MODEL_OPTIONS = GOOGLE_INFERENCE_MODELS.map(
	(model) => ({
		value: model,
		label: model,
	}),
);

export type WhisperingSoundNames =
	| 'manual-start'
	| 'manual-stop'
	| 'manual-cancel'
	| 'cpal-start'
	| 'cpal-stop'
	| 'cpal-cancel'
	| 'vad-start'
	| 'vad-capture'
	| 'vad-stop'
	| 'transcriptionComplete'
	| 'transformationComplete';
