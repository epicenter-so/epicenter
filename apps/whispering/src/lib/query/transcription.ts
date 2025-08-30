import type { Recording } from '$lib/services/db';

import { WhisperingErr, type WhisperingError } from '$lib/result';
import * as services from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, partitionResults, type Result } from 'wellcrafted/result';

import { rpc } from './';
import { defineMutation, queryClient } from './_client';
import { notify } from './notify';
import { recordings } from './recordings';

const transcriptionKeys = {
	isTranscribing: ['transcription', 'isTranscribing'] as const,
} as const;

export const transcription = {
	isCurrentlyTranscribing() {
		return (
			queryClient.isMutating({
				mutationKey: transcriptionKeys.isTranscribing,
			}) > 0
		);
	},
	transcribeRecording: defineMutation({
		mutationKey: transcriptionKeys.isTranscribing,
		resultMutationFn: async (
			recording: Recording,
		): Promise<Result<string, WhisperingError>> => {
			if (!recording.blob) {
				return WhisperingErr({
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to transcribe.",
				});
			}
			const { error: setRecordingTranscribingError } =
				await recordings.updateRecording.execute({
					...recording,
					transcriptionStatus: 'TRANSCRIBING',
				});
			if (setRecordingTranscribingError) {
				notify.warning.execute({
					title:
						'⚠️ Unable to set recording transcription status to transcribing',
					description: 'Continuing with the transcription process...',
					action: {
						error: setRecordingTranscribingError,
						type: 'more-details',
					},
				});
			}
			const { data: transcribedText, error: transcribeError } =
				await transcribeBlob(recording.blob);
			if (transcribeError) {
				const { error: setRecordingTranscribingError } =
					await recordings.updateRecording.execute({
						...recording,
						transcriptionStatus: 'FAILED',
					});
				if (setRecordingTranscribingError) {
					notify.warning.execute({
						title: '⚠️ Unable to update recording after transcription',
						description:
							"Transcription failed but unable to update recording's transcription status in database",
						action: {
							error: setRecordingTranscribingError,
							type: 'more-details',
						},
					});
				}
				return Err(transcribeError);
			}

			const { error: setRecordingTranscribedTextError } =
				await recordings.updateRecording.execute({
					...recording,
					transcribedText,
					transcriptionStatus: 'DONE',
				});
			if (setRecordingTranscribedTextError) {
				notify.warning.execute({
					title: '⚠️ Unable to update recording after transcription',
					description:
						"Transcription completed but unable to update recording's transcribed text and status in database",
					action: {
						error: setRecordingTranscribedTextError,
						type: 'more-details',
					},
				});
			}
			return Ok(transcribedText);
		},
	}),

	transcribeRecordings: defineMutation({
		mutationKey: transcriptionKeys.isTranscribing,
		resultMutationFn: async (recordings: Recording[]) => {
			const results = await Promise.all(
				recordings.map(async (recording) => {
					if (!recording.blob) {
						return WhisperingErr({
							title: '⚠️ Recording blob not found',
							description: "Your recording doesn't have a blob to transcribe.",
						});
					}
					return await transcribeBlob(recording.blob);
				}),
			);
			const partitionedResults = partitionResults(results);
			return Ok(partitionedResults);
		},
	}),
};

async function transcribeBlob(
	blob: Blob,
): Promise<Result<string, WhisperingError>> {
	const selectedService =
		settings.value['transcription.selectedTranscriptionService'];

	// Log transcription request
	const startTime = Date.now();
	rpc.analytics.logEvent.execute({
		provider: selectedService,
		type: 'transcription_requested',
	});

	const transcriptionResult: Result<string, WhisperingError> =
		await (async () => {
			switch (selectedService) {
				case 'Deepgram':
					return await services.transcriptions.deepgram.transcribe(blob, {
						apiKey: settings.value['apiKeys.deepgram'],
						modelName: settings.value['transcription.deepgram.model'],
						outputLanguage: settings.value['transcription.outputLanguage'],
						prompt: settings.value['transcription.prompt'],
						temperature: settings.value['transcription.temperature'],
					});
				case 'ElevenLabs':
					return await services.transcriptions.elevenlabs.transcribe(blob, {
						apiKey: settings.value['apiKeys.elevenlabs'],
						modelName: settings.value['transcription.elevenlabs.model'],
						outputLanguage: settings.value['transcription.outputLanguage'],
						prompt: settings.value['transcription.prompt'],
						temperature: settings.value['transcription.temperature'],
					});
				case 'Groq':
					return await services.transcriptions.groq.transcribe(blob, {
						apiKey: settings.value['apiKeys.groq'],
						modelName: settings.value['transcription.groq.model'],
						outputLanguage: settings.value['transcription.outputLanguage'],
						prompt: settings.value['transcription.prompt'],
						temperature: settings.value['transcription.temperature'],
					});
				case 'OpenAI':
					return await services.transcriptions.openai.transcribe(blob, {
						apiKey: settings.value['apiKeys.openai'],
						modelName: settings.value['transcription.openai.model'],
						outputLanguage: settings.value['transcription.outputLanguage'],
						prompt: settings.value['transcription.prompt'],
						temperature: settings.value['transcription.temperature'],
					});
				case 'speaches':
					return await services.transcriptions.speaches.transcribe(blob, {
						baseUrl: settings.value['transcription.speaches.baseUrl'],
						modelId: settings.value['transcription.speaches.modelId'],
						outputLanguage: settings.value['transcription.outputLanguage'],
						prompt: settings.value['transcription.prompt'],
						temperature: settings.value['transcription.temperature'],
					});
				case 'whispercpp':
					return await services.transcriptions.whispercpp.transcribe(blob, {
						modelPath: settings.value['transcription.whispercpp.modelPath'],
						outputLanguage: settings.value['transcription.outputLanguage'],
						prompt: settings.value['transcription.prompt'],
						temperature: settings.value['transcription.temperature'],
						useGpu: settings.value['transcription.whispercpp.useGpu'],
					});
				default:
					return WhisperingErr({
						title: '⚠️ No transcription service selected',
						description: 'Please select a transcription service in settings.',
					});
			}
		})();

	// Log transcription result
	const duration = Date.now() - startTime;
	if (transcriptionResult.error) {
		rpc.analytics.logEvent.execute({
			error_description: transcriptionResult.error.description,
			error_title: transcriptionResult.error.title,
			provider: selectedService,
			type: 'transcription_failed',
		});
	} else {
		rpc.analytics.logEvent.execute({
			duration,
			provider: selectedService,
			type: 'transcription_completed',
		});
	}

	return transcriptionResult;
}
