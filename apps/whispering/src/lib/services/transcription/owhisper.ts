import { WhisperingErr, type WhisperingError } from '$lib/result';
import type { Settings } from '$lib/settings';
import type { HttpService } from '$lib/services/http';
import { Ok, type Result } from 'wellcrafted/result';
import { HttpServiceLive } from '$lib/services/http';
// import WebSocket from '@tauri-apps/plugin-websocket';

// Simplified StreamResponse type for what we actually need
type StreamResponse =
	| {
			type: 'Results';
			is_final: boolean;
			speech_final: boolean;
			channel: {
				alternatives: Array<{
					transcript: string;
				}>;
			};
	  }
	| {
			request_id: string;
			created: string;
	  };

async function transcribeWithWebSocket(
	audioBlob: Blob,
	baseUrl: string,
	modelId: string,
): Promise<Result<string, WhisperingError>> {
	let ws: any = null;

	try {
		// Convert audio blob to byte array
		const arrayBuffer = await audioBlob.arrayBuffer();
		const audioData = new Uint8Array(arrayBuffer);
		console.log('Audio blob type:', audioBlob.type);
		console.log('Audio size:', audioData.length, 'bytes');

		// Build WebSocket URL - simpler approach
		const wsUrl = `${baseUrl.replace(/^https?:/, baseUrl.includes('localhost') ? 'ws:' : 'wss:')}/v1/listen?model=${modelId}&channels=1&sample_rate=16000&encoding=linear16&interim_results=true`;

		console.log('Connecting to Owhisper WebSocket:', wsUrl);
		ws = await WebSocket.connect(wsUrl);

		let finalTranscript = '';

		return new Promise((resolve) => {
			ws.addListener((message: any) => {
				try {
					console.log('Raw WebSocket message type:', typeof message, 'value:', message);

					// Handle Tauri WebSocket event objects
					if (typeof message === 'object' && message.type) {
						if (message.type === 'Text') {
							// Text message contains JSON data
							const jsonData = message.data;
							console.log('JSON data received:', jsonData);

							let response: StreamResponse;
							try {
								response = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
							} catch (parseError) {
								console.error('Failed to parse JSON:', parseError, 'Data was:', jsonData);
								return;
							}

							if ('channel' in response && response.type === 'Results') {
								const transcript =
									response.channel?.alternatives?.[0]?.transcript || '';
								console.log('Received transcript, is_final:', response.is_final, 'speech_final:', response.speech_final, 'text:', transcript);
								if (
									response.is_final &&
									response.speech_final &&
									transcript.trim()
								) {
									finalTranscript +=
										(finalTranscript ? ' ' : '') + transcript.trim();
									console.log('Added to final transcript:', transcript);
								}
							}

							if ('request_id' in response && 'created' in response) {
								console.log('Transcription session started, request_id:', response.request_id);
								// Don't resolve here, wait for actual transcription
							}
						} else if (message.type === 'Close') {
							console.log('WebSocket closed, final transcript:', finalTranscript, 'close data:', message.data);
							if (finalTranscript) {
								resolve(Ok(finalTranscript));
							} else {
								resolve(
									WhisperingErr({
										title: '🔌 No Transcription',
										description:
											'Connection closed without receiving any transcription.',
									}),
								);
							}
						} else if (message.type === 'Binary') {
							console.log('Binary message received, ignoring');
						}
					}
				} catch (error) {
					console.error('Error handling WebSocket message:', error);
					console.error('Message was:', message);
				}
			});

			// Send audio data and end signal
			setTimeout(async () => {
				try {
					console.log('Sending audio data, length:', audioData.length);
					console.log('Audio data type:', typeof audioData, 'is Uint8Array:', audioData instanceof Uint8Array);
					console.log('First few bytes:', Array.from(audioData.slice(0, 10)));

					// Send as array of numbers for Tauri WebSocket (it expects number[])
					const audioArray = Array.from(audioData);
					await ws.send(audioArray);
					console.log('Sent audio data successfully');

					// Send end-of-stream signal after a short delay
					setTimeout(async () => {
						try {
							await ws.send([]);
							console.log('Sent end-of-stream signal');
						} catch (err) {
							console.error('Failed to send end-of-stream:', err);
						}
					}, 500);
				} catch (error) {
					console.error('Failed to send audio data:', error);
					resolve(
						WhisperingErr({
							title: '📡 WebSocket Send Error',
							description: 'Failed to send audio data to Owhisper server.',
						}),
					);
				}
			}, 100);

			setTimeout(
				() =>
					resolve(
						WhisperingErr({
							title: '⏱️ Owhisper Timeout',
							description:
								'No response received from Owhisper server within 30 seconds.',
						}),
					),
				30000,
			);
		});
	} catch (error) {
		console.error('WebSocket connection error:', error);
		if (error && error.toString().includes('Connection refused')) {
			return WhisperingErr({
				title: '🔌 Connection Failed',
				description: `Could not connect to Owhisper server at ${baseUrl}. Make sure the server is running.`,
				action: {
					type: 'link',
					label: 'Setup guide',
					href: '/settings/transcription',
				},
			});
		}

		return WhisperingErr({
			title: '📡 WebSocket Error',
			description:
				'Failed to establish WebSocket connection with Owhisper server.',
			action: { type: 'more-details', error: error as Error },
		});
	} finally {
		if (ws) {
			try {
				await ws.disconnect();
			} catch (error) {
				console.warn('Error disconnecting WebSocket:', error);
			}
		}
	}
}

export function createOwhisperTranscriptionService({
	HttpService,
}: {
	HttpService: HttpService;
}) {
	return {
		async transcribe(
			audioBlob: Blob,
			options: {
				prompt: string;
				temperature: string;
				outputLanguage: Settings['transcription.outputLanguage'];
				baseUrl: string;
				modelId: string;
			},
		): Promise<Result<string, WhisperingError>> {
			if (!options.modelId) {
				return WhisperingErr({
					title: '🤖 Model Required',
					description:
						'Please specify which model to use. Download a model first using "owhisper pull MODEL_NAME".',
					action: {
						type: 'link',
						label: 'Configure model',
						href: '/settings/transcription',
					},
				});
			}

			if (!options.baseUrl) {
				return WhisperingErr({
					title: '🌐 Server URL Required',
					description:
						'Please specify the Owhisper server URL (e.g., http://localhost:8080).',
					action: {
						type: 'link',
						label: 'Configure server',
						href: '/settings/transcription',
					},
				});
			}

			return transcribeWithWebSocket(
				audioBlob,
				options.baseUrl,
				options.modelId,
			);
		},
	};
}

export type OwhisperTranscriptionService = ReturnType<
	typeof createOwhisperTranscriptionService
>;

export const OwhisperTranscriptionServiceLive =
	createOwhisperTranscriptionService({
		HttpService: HttpServiceLive,
	});
