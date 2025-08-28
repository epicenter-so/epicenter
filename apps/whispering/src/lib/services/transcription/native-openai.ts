import { invoke } from '@tauri-apps/api/core';
import { WhisperingErr, type WhisperingError } from '$lib/result';
import type { Settings } from '$lib/settings';
import { getExtensionFromAudioBlob } from '$lib/services/_utils';
import { Err, Ok, type Result, tryAsync } from 'wellcrafted/result';

const MAX_FILE_SIZE_MB = 25 as const;

export function createNativeOpenaiTranscriptionService() {
	return {
		async transcribe(
			audioBlob: Blob,
			options: {
				prompt: string;
				temperature: string;
				outputLanguage: Settings['transcription.outputLanguage'];
				apiKey: string;
				modelName: string;
				baseURL?: string;
			},
		): Promise<Result<string, WhisperingError>> {
			// Pre-validation: Check API key
			if (!options.apiKey) {
				return WhisperingErr({
					title: '🔑 API Key Required',
					description:
						'Please enter your OpenAI API key in settings to use Whisper transcription.',
					action: {
						type: 'link',
						label: 'Add API key',
						href: '/settings/transcription',
					},
				});
			}

			// Only validate API key format for official OpenAI endpoint
			if (!options.baseURL && !options.apiKey.startsWith('sk-')) {
				return WhisperingErr({
					title: '🔑 Invalid API Key Format',
					description:
						'Your OpenAI API key should start with "sk-". Please check and update your API key.',
					action: {
						type: 'link',
						label: 'Update API key',
						href: '/settings/transcription',
					},
				});
			}

			// Validate file size
			const blobSizeInMb = audioBlob.size / (1024 * 1024);
			if (blobSizeInMb > MAX_FILE_SIZE_MB) {
				return WhisperingErr({
					title: `The file size (${blobSizeInMb}MB) is too large`,
					description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
				});
			}

			console.log('🔗 Native OpenAI API Call:', {
				baseURL: options.baseURL || 'https://api.openai.com/v1 (default)',
				model: options.modelName,
				hasCustomEndpoint: !!options.baseURL,
				blobSize: `${blobSizeInMb.toFixed(2)}MB`,
			});

			// Convert blob to array buffer
			const { data: audioBuffer, error: bufferError } = await tryAsync({
				try: () => audioBlob.arrayBuffer(),
				mapErr: () =>
					WhisperingErr({
						title: '📁 File Processing Failed',
						description:
							'Failed to process audio file for transcription. Please try again.',
					}),
			});

			if (bufferError) return Err(bufferError);

			// Convert to Uint8Array for Tauri
			const audioBytes = new Uint8Array(audioBuffer);

			// Call native Tauri command
			const { data: transcription, error: nativeApiError } = await tryAsync({
				try: () =>
					invoke<string>('native_openai_transcribe', {
						apiKey: options.apiKey,
						baseUrl: options.baseURL || null,
						model: options.modelName,
						audioBlob: Array.from(audioBytes),
						language:
							options.outputLanguage !== 'auto'
								? options.outputLanguage
								: null,
						prompt: options.prompt || null,
						temperature: options.temperature
							? Number.parseFloat(options.temperature)
							: null,
					}),
				mapErr: (error) =>
					WhisperingErr({
						title: '❌ Transcription Failed',
						description: String(error),
					}),
			});

			if (nativeApiError) {
				console.error('🚫 Native OpenAI API Error:', nativeApiError);
				return Err(nativeApiError);
			}

			console.log('✅ Native transcription completed:', {
				textLength: transcription.length,
			});

			return Ok(transcription.trim());
		},
	};
}

export type NativeOpenaiTranscriptionService = ReturnType<
	typeof createNativeOpenaiTranscriptionService
>;

export const NativeOpenaiTranscriptionServiceLive =
	createNativeOpenaiTranscriptionService();