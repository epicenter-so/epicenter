import type { Accessor } from '$lib/query/types';
import type { Result } from '@epicenterhq/result';
import type {
	MaybePromise,
	RECORDING_METHODS,
	WhisperingSoundNames,
} from '@repo/shared';
import {
	type CreateMutationOptions,
	type CreateQueryOptions,
	type DefaultError,
	type QueryKey,
	createMutation,
	createQuery,
} from '@tanstack/svelte-query';
import { settings } from '../stores/settings.svelte';
import {
	createSetTrayIconDesktopService,
	createSetTrayIconWebService,
} from './SetTrayIconService';
import { createClipboardServiceDesktop } from './clipboard/desktop';
import { createClipboardServiceWeb } from './clipboard/web';
import {
	createDbRecordingsServiceDexie,
	createDbTransformationsServiceDexie,
} from './db/DbService.dexie';
import { createDownloadServiceDesktop } from './download/desktop';
import { createDownloadServiceWeb } from './download/web';
import { createHttpServiceDesktop } from './http/desktop';
import { createHttpServiceWeb } from './http/web';
import { createNotificationServiceDesktop } from './notifications/desktop';
import { createNotificationServiceWeb } from './notifications/web';
import type { RecorderService } from './recorder/_types';
import { createRecorderServiceTauri } from './recorder/tauri';
import { createRecorderServiceWeb } from './recorder/web';
import { createRunTransformationService } from './runTransformation';
import { createPlaySoundServiceDesktop } from './sound/desktop';
import { createPlaySoundServiceWeb } from './sound/web';
import { createElevenLabsTranscriptionService } from './transcription/whisper/elevenlabs';
import { createFasterWhisperServerTranscriptionService } from './transcription/whisper/fasterWhisperServer';
import { createGroqTranscriptionService } from './transcription/whisper/groq';
import { createOpenaiTranscriptionService } from './transcription/whisper/openai';

type QueryResultFunction<TData, TError> = () => MaybePromise<
	Result<TData, TError>
>;

export function createResultQuery<
	TQueryFnData = unknown,
	TError = DefaultError,
	TData = TQueryFnData,
	TQueryKey extends QueryKey = QueryKey,
>(
	options: Accessor<
		Omit<
			CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
			'queryFn'
		> & {
			queryFn: QueryResultFunction<TQueryFnData, TError>;
		}
	>,
) {
	return createQuery<TQueryFnData, TError, TData, TQueryKey>(() => {
		const { queryFn, ...optionValues } = options();
		return {
			...optionValues,

			queryFn: async () => {
				const { data, error } = await queryFn();
				if (error) throw error;
				return data;
			},
		};
	});
}

export function createResultMutation<
	TData = unknown,
	TError = DefaultError,
	TVariables = void,
	TContext = unknown,
>(
	options: Accessor<
		Omit<
			CreateMutationOptions<TData, TError, TVariables, TContext>,
			'mutationFn'
		> & {
			mutationFn: (
				variables: TVariables,
			) => MaybePromise<Result<TData, TError>>;
		}
	>,
) {
	return createMutation<TData, TError, TVariables, TContext>(() => {
		const { mutationFn, ...optionValues } = options();
		return {
			...optionValues,
			mutationFn: async (args) => {
				const { data, error } = await mutationFn(args);
				if (error) throw error;
				return data;
			},
		};
	});
}

export const DownloadService = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktop()
	: createDownloadServiceWeb();

export const NotificationService = window.__TAURI_INTERNALS__
	? createNotificationServiceDesktop()
	: createNotificationServiceWeb();

export const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop()
	: createClipboardServiceWeb();

export const SetTrayIconService = window.__TAURI_INTERNALS__
	? createSetTrayIconDesktopService()
	: createSetTrayIconWebService();

export const DbRecordingsService = createDbRecordingsServiceDexie();
export const DbTransformationsService = createDbTransformationsServiceDexie();

const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktop()
	: createHttpServiceWeb();

const PlaySoundService = window.__TAURI_INTERNALS__
	? createPlaySoundServiceDesktop()
	: createPlaySoundServiceWeb();

export const RunTransformationService = createRunTransformationService({
	HttpService,
	DbTransformationsService,
});

/**
 * Services that are determined by the user's settings.
 */
export const userConfiguredServices = (() => {
	const RecorderServiceTauri = createRecorderServiceTauri();
	const RecorderServiceWeb = createRecorderServiceWeb();

	return {
		get transcription() {
			switch (settings.value['transcription.selectedTranscriptionService']) {
				case 'OpenAI': {
					return createOpenaiTranscriptionService({
						HttpService,
						apiKey: settings.value['apiKeys.openai'],
					});
				}
				case 'Groq': {
					return createGroqTranscriptionService({
						HttpService,
						apiKey: settings.value['apiKeys.groq'],
						modelName: settings.value['transcription.groq.model'],
					});
				}
				case 'faster-whisper-server': {
					return createFasterWhisperServerTranscriptionService({
						HttpService,
						serverModel:
							settings.value['transcription.fasterWhisperServer.serverModel'],
						serverUrl:
							settings.value['transcription.fasterWhisperServer.serverUrl'],
					});
				}
				case 'ElevenLabs': {
					return createElevenLabsTranscriptionService({
						apiKey: settings.value['apiKeys.elevenlabs'],
					});
				}
				default: {
					return createOpenaiTranscriptionService({
						HttpService,
						apiKey: settings.value['apiKeys.openai'],
					});
				}
			}
		},
		get recorder() {
			const recorderServices = {
				tauri: RecorderServiceTauri,
				navigator: RecorderServiceWeb,
			} satisfies Record<(typeof RECORDING_METHODS)[number], RecorderService>;
			const recordingMethod = settings.value['recording.method'];
			return recorderServices[recordingMethod];
		},
	};
})();

export const playSoundIfEnabled = (soundName: WhisperingSoundNames) => {
	if (settings.value[`sound.playOn.${soundName}`]) {
		void PlaySoundService.playSound(soundName);
	}
};
