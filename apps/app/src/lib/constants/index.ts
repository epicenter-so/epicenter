/**
 * Constants root export file
 * 
 * This file provides convenient namespace exports for all constant categories.
 * For better tree-shaking and explicit dependencies, prefer direct imports:
 * 
 * @example
 * // Preferred: Direct import from category
 * import { WHISPERING_URL } from '$lib/constants/app';
 * 
 * // Alternative: Namespace import for related constants
 * import * as AppConstants from '$lib/constants/app';
 */

// Re-export all categories as namespaces
export * as App from './app';
export * as Audio from './audio';
export * as Database from './database';
export * as Inference from './inference';
export * as Keyboard from './keyboard';
export * as Languages from './languages';
export * as Platform from './platform';
export * as Sounds from './sounds';
export * as Transcription from './transcription';
export * as UI from './ui';

// Explicit flat exports for backwards compatibility
// App constants
export {
	WHISPERING_URL,
	WHISPERING_URL_WILDCARD,
	WHISPERING_RECORDINGS_PATHNAME,
	WHISPERING_SETTINGS_PATHNAME,
	DEBOUNCE_TIME_MS,
} from './app';

// Audio constants
export {
	BITRATE_VALUES_KBPS,
	BITRATE_OPTIONS,
	DEFAULT_BITRATE_KBPS,
	RECORDING_MODES,
	RECORDING_MODE_OPTIONS,
	recordingStateSchema,
	recorderStateToIcons,
	cpalStateToIcons,
	vadStateSchema,
	vadStateToIcons,
	TIMESLICE_MS,
	WHISPER_RECOMMENDED_MEDIA_TRACK_CONSTRAINTS,
	type RecordingMode,
	type WhisperingRecordingState,
	type CancelRecordingResult,
	type VadState,
} from './audio';

// Database constants
export {
	TRANSFORMATION_STEP_TYPES,
	TRANSFORMATION_STEP_TYPES_TO_LABELS,
} from './database';

// Inference constants
export {
	INFERENCE_PROVIDERS,
	INFERENCE_PROVIDER_OPTIONS,
	OPENAI_INFERENCE_MODELS,
	OPENAI_INFERENCE_MODEL_OPTIONS,
	GROQ_INFERENCE_MODELS,
	GROQ_INFERENCE_MODEL_OPTIONS,
	ANTHROPIC_INFERENCE_MODELS,
	ANTHROPIC_INFERENCE_MODEL_OPTIONS,
	GOOGLE_INFERENCE_MODELS,
	GOOGLE_INFERENCE_MODEL_OPTIONS,
} from './inference';

// Keyboard constants
export {
	ACCELERATOR_SECTIONS,
	ACCELERATOR_MODIFIER_KEYS,
	ACCELERATOR_KEY_CODES,
	KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS,
	KEYBOARD_EVENT_SUPPORTED_KEYS,
	isSupportedKey,
	normalizeOptionKeyCharacter,
	OPTION_DEAD_KEYS,
	CommandOrControl,
	CommandOrAlt,
	type AcceleratorPossibleKey,
	type AcceleratorModifier,
	type AcceleratorKeyCode,
	type KeyboardEventPossibleKey,
	type KeyboardEventSupportedKey,
} from './keyboard';

// Language constants
export {
	SUPPORTED_LANGUAGES,
	SUPPORTED_LANGUAGES_OPTIONS,
	type SupportedLanguage,
} from './languages';

// Platform constants
export { IS_MACOS } from './platform';

// Sound constants
export type { WhisperingSoundNames } from './sounds';

// Transcription constants
export {
	OPENAI_TRANSCRIPTION_MODELS,
	GROQ_MODELS,
	ELEVENLABS_TRANSCRIPTION_MODELS,
	TRANSCRIPTION_SERVICE_IDS,
	TRANSCRIPTION_SERVICES,
	TRANSCRIPTION_SERVICE_OPTIONS,
	type GroqModel,
	type ElevenLabsModel,
	type TranscriptionService,
} from './transcription';

// UI constants
export {
	ALWAYS_ON_TOP_VALUES,
	ALWAYS_ON_TOP_OPTIONS,
} from './ui';