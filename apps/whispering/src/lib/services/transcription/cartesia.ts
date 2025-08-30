import { WhisperingErr, type WhisperingError } from '$lib/result';
import type { Settings } from '$lib/settings';
import { Err, Ok, type Result, tryAsync } from 'wellcrafted/result';
import { CartesiaClient, CartesiaError } from '@cartesia/cartesia-js';

export const CARTESIA_TRANSCRIPTION_MODELS = [
	{
		name: 'ink-whisper',
		description:
			'Latest Cartesia Whisper model - fastest, most affordable speech-to-text engineered for enterprise deployment in production-grade voice agents.',
		cost: '1 credit per 2 seconds',
	},
	{
		name: 'ink-whisper-2025-06-04',
		description:
			'Stable snapshot of ink-whisper from June 4, 2025. Recommended for production use cases requiring consistency.',
		cost: '1 credit per 2 seconds',
	},
] as const satisfies {
    name: string;
    description: string;
    cost: string;
}[];

export type CartesiaModel = (typeof CARTESIA_TRANSCRIPTION_MODELS)[number];

const MAX_FILE_SIZE_MB = 2048 as const; // 2GB limit per Cartesia API docs

export function createCartesiaTranscriptionService() {
	return {
		async transcribe(
			audioBlob: Blob,
			options: {
				prompt: string;
				temperature: string;
				outputLanguage: Settings['transcription.outputLanguage'];
				apiKey: string;
				modelName: (string & {}) | CartesiaModel['name'];
			},
		): Promise<Result<string, WhisperingError>> {
			// Pre-validate API key
			if (!options.apiKey) {
				return WhisperingErr({
					title: '🔑 API Key Required',
					description: 'Please enter your Cartesia API key in settings.',
					action: {
						type: 'link',
						label: 'Add API key',
						href: '/settings/transcription',
					},
				});
			}

			// Check file size
			const blobSizeInMb = audioBlob.size / (1024 * 1024);
			if (blobSizeInMb > MAX_FILE_SIZE_MB) {
				return WhisperingErr({
					title: `The file size (${blobSizeInMb.toFixed(1)}MB) is too large`,
					description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
				});
			}

			// Create Cartesia client
			const client = new CartesiaClient({
				apiKey: options.apiKey,
			});

			// Convert blob to buffer for the SDK
			const { data: arrayBuffer, error: bufferError } = await tryAsync({
				try: () => audioBlob.arrayBuffer(),
				mapErr: (error) =>
					WhisperingErr({
						title: '📄 Audio Processing Failed',
						description: 'Failed to process audio file. Please try again.',
						action: { type: 'more-details', error },
					}),
			});

			if (bufferError) return Err(bufferError);

			// Make the transcription request using the SDK
			const { data: response, error: cartesiaError } = await tryAsync({
				try: async () => {
					// Note: The official SDK currently focuses on WebSocket streaming STT.
					// For now, we'll use the REST API approach but with better error handling
					// until the SDK adds a simple non-streaming transcription method.
					const formData = new FormData();
					formData.append('file', audioBlob, 'recording.wav');
					formData.append('model', options.modelName);
					
					// Add language if not auto
					if (options.outputLanguage !== 'auto') {
						formData.append('language', options.outputLanguage);
					}

					const response = await fetch('https://api.cartesia.ai/stt', {
						method: 'POST',
						headers: {
							'Cartesia-Version': '2025-04-16',
							'Authorization': `Bearer ${options.apiKey}`,
						},
						body: formData,
					});

					if (!response.ok) {
						const errorBody = await response.text();
						let errorMessage: string;
						
						try {
							const errorJson = JSON.parse(errorBody);
							errorMessage = errorJson.message || errorJson.error || 'Unknown error';
						} catch {
							errorMessage = errorBody || 'Unknown error';
						}

						throw new Error(`HTTP ${response.status}: ${errorMessage}`);
					}

					return await response.json();
				},
				mapErr: (error) => {
					// Handle CartesiaError from SDK
					if (error instanceof CartesiaError) {
						const { statusCode, message } = error;

						// 400 - Bad Request
						if (statusCode === 400) {
							return WhisperingErr({
								title: '❌ Bad Request',
								description: message || 'Invalid request parameters. Please check your audio file and settings.',
								action: { type: 'more-details', error },
							});
						}

						// 401 - Authentication Error
						if (statusCode === 401) {
							return WhisperingErr({
								title: '🔑 Authentication Failed',
								description: message || 'Your API key appears to be invalid or expired. Please update your API key in settings.',
								action: {
									type: 'link',
									label: 'Update API key',
									href: '/settings/transcription',
								},
							});
						}

						// 403 - Permission Denied
						if (statusCode === 403) {
							return WhisperingErr({
								title: '⛔ Permission Denied',
								description: message || "Your account doesn't have access to this feature. This may be due to plan limitations or account restrictions.",
								action: { type: 'more-details', error },
							});
						}

						// 404 - Not Found
						if (statusCode === 404) {
							return WhisperingErr({
								title: '🔍 Not Found',
								description: message || 'The requested resource was not found. This might indicate an issue with the model or API endpoint.',
								action: { type: 'more-details', error },
							});
						}

						// 429 - Rate Limit
						if (statusCode === 429) {
							return WhisperingErr({
								title: '⏱️ Rate Limit Reached',
								description: message || 'Too many requests. Please try again in a few minutes.',
								action: { type: 'more-details', error },
							});
						}

						// 5xx - Server Error
						if (statusCode && statusCode >= 500) {
							return WhisperingErr({
								title: '🔧 Service Unavailable',
								description: message || `The Cartesia service is temporarily unavailable (Error ${statusCode}). Please try again in a few minutes.`,
								action: { type: 'more-details', error },
							});
						}

						// Generic CartesiaError
						return WhisperingErr({
							title: '❌ Cartesia API Error',
							description: message || 'An error occurred with the Cartesia service.',
							action: { type: 'more-details', error },
						});
					}

					// Handle regular HTTP errors
					const message = error instanceof Error ? error.message : 'Unknown error occurred';
					
					if (message.includes('HTTP 400')) {
						return WhisperingErr({
							title: '❌ Bad Request',
							description: 'Invalid request parameters. Please check your audio file and settings.',
							action: { type: 'more-details', error },
						});
					}
					
					if (message.includes('HTTP 401')) {
						return WhisperingErr({
							title: '🔑 Authentication Failed',
							description: 'Your API key appears to be invalid or expired. Please update your API key in settings.',
							action: {
								type: 'link',
								label: 'Update API key',
								href: '/settings/transcription',
							},
						});
					}
					
					if (message.includes('HTTP 403')) {
						return WhisperingErr({
							title: '⛔ Permission Denied',
							description: "Your account doesn't have access to this feature. This may be due to plan limitations or account restrictions.",
							action: { type: 'more-details', error },
						});
					}
					
					if (message.includes('HTTP 404')) {
						return WhisperingErr({
							title: '🔍 Not Found',
							description: 'The requested resource was not found. This might indicate an issue with the model or API endpoint.',
							action: { type: 'more-details', error },
						});
					}
					
					if (message.includes('HTTP 413')) {
						return WhisperingErr({
							title: '📁 File Too Large',
							description: 'Your audio file is too large for the service. Please try a shorter recording or compress the file.',
							action: { type: 'more-details', error },
						});
					}
					
					if (message.includes('HTTP 422')) {
						return WhisperingErr({
							title: '⚠️ Invalid Input',
							description: 'The request was valid but the server cannot process it. Please check your audio file format and parameters.',
							action: { type: 'more-details', error },
						});
					}
					
					if (message.includes('HTTP 429')) {
						return WhisperingErr({
							title: '⏱️ Rate Limit Reached',
							description: 'Too many requests. Please try again in a few minutes.',
							action: { type: 'more-details', error },
						});
					}
					
					if (message.includes('HTTP 5')) {
						return WhisperingErr({
							title: '🔧 Service Unavailable',
							description: 'The Cartesia service is temporarily unavailable. Please try again in a few minutes.',
							action: { type: 'more-details', error },
						});
					}
					
					// Handle network errors
					if (message.includes('fetch') || message.includes('network')) {
						return WhisperingErr({
							title: '🌐 Connection Issue',
							description: 'Unable to connect to the Cartesia service. This could be a network issue or temporary service interruption.',
							action: { type: 'more-details', error },
						});
					}
					
					// Generic error fallback
					return WhisperingErr({
						title: '❌ Transcription Failed',
						description: message,
						action: { type: 'more-details', error },
					});
				},
			});

			if (cartesiaError) return Err(cartesiaError);

			// Extract transcript from response
			if (!response || typeof response !== 'object') {
				return WhisperingErr({
					title: '📝 Response Processing Failed',
					description: 'Received an invalid response from Cartesia. Please try again.',
				});
			}
			
			if (!response.text || typeof response.text !== 'string') {
				return WhisperingErr({
					title: '📝 Response Processing Failed',
					description: 'No transcription found in response from Cartesia. Please try again.',
				});
			}

			return Ok(response.text.trim());
		},
	};
}

export type CartesiaTranscriptionService = ReturnType<
	typeof createCartesiaTranscriptionService
>;

export const CartesiaTranscriptionServiceLive = createCartesiaTranscriptionService();
