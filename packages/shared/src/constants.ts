import { z } from 'zod';

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

export const recordingStateSchema = z.enum([
	'IDLE',
	'SESSION',
	'SESSION+RECORDING',
]);

export type WhisperingRecordingState = z.infer<typeof recordingStateSchema>;

export const recorderStateToIcons = {
	IDLE: '🎙️',
	SESSION: '🎙️',
	'SESSION+RECORDING': '⏹️',
} as const satisfies Record<WhisperingRecordingState, string>;

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

export const TRANSCRIPTION_SERVICES = [
	'OpenAI',
	'Groq',
	'faster-whisper-server',
] as const;

export const TRANSCRIPTION_SERVICE_OPTIONS = TRANSCRIPTION_SERVICES.map(
	(service) => ({
		value: service,
		label: service,
	}),
);

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

export const GROQ_MODELS = [
	'whisper-large-v3',
	'whisper-large-v3-turbo',
	'distil-whisper-large-v3-en',
] as const;

export const GROQ_MODELS_OPTIONS = GROQ_MODELS.map((model) => ({
	value: model,
	label: model,
}));

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
	| 'vad-start'
	| 'vad-capture'
	| 'vad-stop'
	| 'transcriptionComplete'
	| 'transformationComplete';
