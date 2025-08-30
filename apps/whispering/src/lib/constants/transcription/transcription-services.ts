/**
 * Transcription service configurations
 */
import type { Settings } from '$lib/settings';

import deepgramIcon from '$lib/constants/icons/deepgram.svg?raw';
import elevenlabsIcon from '$lib/constants/icons/elevenlabs.svg?raw';
import ggmlIcon from '$lib/constants/icons/ggml.svg?raw';
// Import SVG icons as strings
import groqIcon from '$lib/constants/icons/groq.svg?raw';
import openaiIcon from '$lib/constants/icons/openai.svg?raw';
import speachesIcon from '$lib/constants/icons/speaches.svg?raw';
import {
	DEEPGRAM_TRANSCRIPTION_MODELS,
	type DeepgramModel,
} from '$lib/services/transcription/deepgram';
import {
	ELEVENLABS_TRANSCRIPTION_MODELS,
	type ElevenLabsModel,
} from '$lib/services/transcription/elevenlabs';
import { GROQ_MODELS, type GroqModel } from '$lib/services/transcription/groq';
import {
	OPENAI_TRANSCRIPTION_MODELS,
	type OpenAIModel,
} from '$lib/services/transcription/openai';

type TranscriptionModel =
	| DeepgramModel
	| ElevenLabsModel
	| GroqModel
	| OpenAIModel;

export const TRANSCRIPTION_SERVICE_IDS = [
	'whispercpp',
	'Groq',
	'OpenAI',
	'ElevenLabs',
	'Deepgram',
	'speaches',
	// 'owhisper',
] as const;

type BaseTranscriptionService = {
	description?: string;
	icon: string; // SVG string
	id: TranscriptionServiceId;
	invertInDarkMode: boolean; // Whether to invert the icon in dark mode
	name: string;
};

type CloudTranscriptionService = BaseTranscriptionService & {
	apiKeyField: keyof Settings;
	defaultModel: TranscriptionModel;
	location: 'cloud';
	models: readonly TranscriptionModel[];
	modelSettingKey: string;
};

type LocalTranscriptionService = BaseTranscriptionService & {
	location: 'local';
	modelPathField: keyof Settings;
};

type SatisfiedTranscriptionService =
	| CloudTranscriptionService
	| LocalTranscriptionService
	| SelfHostedTranscriptionService;

type SelfHostedTranscriptionService = BaseTranscriptionService & {
	location: 'self-hosted';
	serverUrlField: keyof Settings;
};

type TranscriptionServiceId = (typeof TRANSCRIPTION_SERVICE_IDS)[number];

export const TRANSCRIPTION_SERVICES = [
	// Local services first (truly offline)
	{
		description: 'Fast local transcription with no internet required',
		icon: ggmlIcon,
		id: 'whispercpp',
		invertInDarkMode: true,
		location: 'local',
		modelPathField: 'transcription.whispercpp.modelPath',
		name: 'Whisper C++',
	},
	// Cloud services (API-based)
	{
		description: 'Lightning-fast cloud transcription',
		apiKeyField: 'apiKeys.groq',
		defaultModel: GROQ_MODELS[2],
		icon: groqIcon,
		id: 'Groq',
		invertInDarkMode: false, // Groq has a colored logo that works in both modes
		location: 'cloud',
		models: GROQ_MODELS,
		modelSettingKey: 'transcription.groq.model',
		name: 'Groq',
	},
	{
		description: 'Industry-standard Whisper API',
		apiKeyField: 'apiKeys.openai',
		defaultModel: OPENAI_TRANSCRIPTION_MODELS[0],
		icon: openaiIcon,
		id: 'OpenAI',
		invertInDarkMode: true,
		location: 'cloud',
		models: OPENAI_TRANSCRIPTION_MODELS,
		modelSettingKey: 'transcription.openai.model',
		name: 'OpenAI',
	},
	{
		description: 'Voice AI platform with transcription',
		apiKeyField: 'apiKeys.elevenlabs',
		defaultModel: ELEVENLABS_TRANSCRIPTION_MODELS[0],
		icon: elevenlabsIcon,
		id: 'ElevenLabs',
		invertInDarkMode: true,
		location: 'cloud',
		models: ELEVENLABS_TRANSCRIPTION_MODELS,
		modelSettingKey: 'transcription.elevenlabs.model',
		name: 'ElevenLabs',
	},
	{
		description: 'Real-time speech recognition API',
		apiKeyField: 'apiKeys.deepgram',
		defaultModel: DEEPGRAM_TRANSCRIPTION_MODELS[0],
		icon: deepgramIcon,
		id: 'Deepgram',
		invertInDarkMode: true,
		location: 'cloud',
		models: DEEPGRAM_TRANSCRIPTION_MODELS,
		modelSettingKey: 'transcription.deepgram.model',
		name: 'Deepgram',
	},
	// Self-hosted services
	{
		description: 'Self-hosted transcription server',
		icon: speachesIcon,
		id: 'speaches',
		invertInDarkMode: false, // Speaches has a colored logo
		location: 'self-hosted',
		name: 'Speaches',
		serverUrlField: 'transcription.speaches.baseUrl',
	},
	// {
	// 	id: 'owhisper',
	// 	name: 'Owhisper',
	// 	icon: ServerIcon,
	// 	serverUrlField: 'transcription.owhisper.baseUrl',
	// 	location: 'self-hosted',
	// },
] as const satisfies SatisfiedTranscriptionService[];

export const TRANSCRIPTION_SERVICE_OPTIONS = TRANSCRIPTION_SERVICES.map(
	(service) => ({
		label: service.name,
		value: service.id,
	}),
);

export type TranscriptionService = (typeof TRANSCRIPTION_SERVICES)[number];
