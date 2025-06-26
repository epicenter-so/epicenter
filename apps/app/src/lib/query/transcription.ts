import type { Recording } from '$lib/services/db';
import * as services from '$lib/services';
import { toast } from '$lib/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, type Result, partitionResults } from '@epicenterhq/result';
import type { WhisperingError } from '$lib/result';
import { defineMutation } from './_utils';
import { queryClient } from './index';
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
				return Err({
					name: 'WhisperingError',
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to transcribe.",
					context: { recording },
					cause: undefined,
				});
			}
			const { error: setRecordingTranscribingError } =
				await recordings.updateRecording.execute({
					...recording,
					transcriptionStatus: 'TRANSCRIBING',
				});
			if (setRecordingTranscribingError) {
				toast.warning({
					title:
						'⚠️ Unable to set recording transcription status to transcribing',
					description: 'Continuing with the transcription process...',
					action: {
						type: 'more-details',
						error: setRecordingTranscribingError,
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
					toast.warning({
						title: '⚠️ Unable to update recording after transcription',
						description:
							"Transcription failed but unable to update recording's transcription status in database",
						action: {
							type: 'more-details',
							error: setRecordingTranscribingError,
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
				toast.warning({
					title: '⚠️ Unable to update recording after transcription',
					description:
						"Transcription completed but unable to update recording's transcribed text and status in database",
					action: {
						type: 'more-details',
						error: setRecordingTranscribedTextError,
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
						return Err({
							name: 'WhisperingError',
							title: '⚠️ Recording blob not found',
							description: "Your recording doesn't have a blob to transcribe.",
							context: { recording },
							cause: undefined,
						} satisfies WhisperingError);
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

	switch (selectedService) {
		case 'OpenAI':
			return services.transcriptions.openai.transcribe(blob, {
				outputLanguage: settings.value['transcription.outputLanguage'],
				prompt: settings.value['transcription.prompt'],
				temperature: settings.value['transcription.temperature'],
				apiKey: settings.value['apiKeys.openai'],
				model: settings.value['transcription.openai.model'],
			});
		case 'Groq':
			return services.transcriptions.groq.transcribe(blob, {
				outputLanguage: settings.value['transcription.outputLanguage'],
				prompt: settings.value['transcription.prompt'],
				temperature: settings.value['transcription.temperature'],
				apiKey: settings.value['apiKeys.groq'],
				model: settings.value['transcription.groq.model'],
			});
		case 'speaches':
			return services.transcriptions.speaches.transcribe(blob, {
				outputLanguage: settings.value['transcription.outputLanguage'],
				prompt: settings.value['transcription.prompt'],
				temperature: settings.value['transcription.temperature'],
				modelId: settings.value['transcription.speaches.modelId'],
				baseUrl: settings.value['transcription.speaches.baseUrl'],
			});
		case 'ElevenLabs':
			return services.transcriptions.elevenlabs.transcribe(blob, {
				outputLanguage: settings.value['transcription.outputLanguage'],
				prompt: settings.value['transcription.prompt'],
				temperature: settings.value['transcription.temperature'],
				apiKey: settings.value['apiKeys.elevenlabs'],
				model: settings.value['transcription.elevenlabs.model'],
			});
	}
}
