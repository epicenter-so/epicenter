import type { Settings } from '$lib/settings';

import { rpc } from '$lib/query';
import {
	WhisperingErr,
	type WhisperingError,
	WhisperingWarningErr,
} from '$lib/result';
import { invoke } from '@tauri-apps/api/core';
import { exists } from '@tauri-apps/plugin-fs';
import { type } from 'arktype';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok, type Result, tryAsync } from 'wellcrafted/result';

const WhisperCppErrorType = type({
	message: 'string',
	name: "'AudioReadError' | 'GpuError' | 'ModelLoadError' | 'TranscriptionError'",
});

export type WhisperCppTranscriptionService = ReturnType<
	typeof createWhisperCppTranscriptionService
>;

export function createWhisperCppTranscriptionService() {
	return {
		async transcribe(
			audioBlob: Blob,
			options: {
				modelPath: string;
				outputLanguage: Settings['transcription.outputLanguage'];
				prompt: string;
				temperature: string;
				useGpu: boolean;
			},
		): Promise<Result<string, WhisperingError>> {
			// Pre-validation
			if (!options.modelPath) {
				return WhisperingErr({
					title: '📁 Model File Required',
					description: 'Please select a Whisper model file in settings.',
					action: {
						href: '/settings/transcription',
						label: 'Configure model',
						type: 'link',
					},
				});
			}

			// Check if model file exists
			const { data: isExists } = await tryAsync({
				mapErr: () => Ok(false),
				try: () => exists(options.modelPath),
			});

			if (!isExists) {
				return WhisperingErr({
					title: '❌ Model File Not Found',
					description: `The model file "${options.modelPath}" does not exist.`,
					action: {
						href: '/settings/transcription',
						label: 'Select model',
						type: 'link',
					},
				});
			}

			// Check if FFmpeg is installed
			const ffmpegResult = await rpc.ffmpeg.checkFfmpegInstalled.ensure();
			if (ffmpegResult.error) return ffmpegResult;
			if (!ffmpegResult.data) {
				return WhisperingWarningErr({
					title: '🛠️ Install FFmpeg',
					description:
						'FFmpeg is required for enhanced audio format support. Install it to transcribe non-WAV audio files with Whisper C++.',
					action: {
						href: '/install-ffmpeg',
						label: 'Install FFmpeg',
						type: 'link',
					},
				});
			}

			// Convert audio blob to byte array
			const arrayBuffer = await audioBlob.arrayBuffer();
			const audioData = Array.from(new Uint8Array(arrayBuffer));

			// Call Tauri command to transcribe with whisper-cpp
			const result = await tryAsync({
				mapErr: (unknownError) => {
					const result = WhisperCppErrorType(unknownError);
					if (result instanceof type.errors) {
						return WhisperingErr({
							title: '❌ Unexpected Whisper C++ Error',
							description: extractErrorMessage(unknownError),
							action: { error: unknownError, type: 'more-details' },
						});
					}
					const error = result;
					switch (error.name) {
						case 'AudioReadError':
							return WhisperingErr({
								title: '🔊 Audio Read Error',
								description: error.message,
								action: {
									error: new Error(error.message),
									type: 'more-details',
								},
							});

						case 'GpuError':
							return WhisperingErr({
								title: '🎮 GPU Error',
								description: error.message,
								action: {
									href: '/settings/transcription',
									label: 'Configure settings',
									type: 'link',
								},
							});

						case 'ModelLoadError':
							return WhisperingErr({
								title: '🤖 Model Loading Error',
								description: error.message,
								action: {
									error: new Error(error.message),
									type: 'more-details',
								},
							});

						case 'TranscriptionError':
							return WhisperingErr({
								title: '❌ Transcription Error',
								description: error.message,
								action: {
									error: new Error(error.message),
									type: 'more-details',
								},
							});

						default:
							return WhisperingErr({
								title: '❌ Whisper C++ Error',
								description: 'An unexpected error occurred.',
								action: {
									error: new Error(String(error)),
									type: 'more-details',
								},
							});
					}
				},
				try: () =>
					invoke<string>('transcribe_with_whisper_cpp', {
						audioData: audioData,
						language:
							options.outputLanguage === 'auto' ? null : options.outputLanguage,
						modelPath: options.modelPath,
						prompt: options.prompt,
						temperature: Number.parseFloat(options.temperature),
						useGpu: options.useGpu,
					}),
			});

			return result;
		},
	};
}

export const WhisperCppTranscriptionServiceLive =
	createWhisperCppTranscriptionService();
