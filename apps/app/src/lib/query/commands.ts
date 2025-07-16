import { WhisperingErr } from '$lib/result';
import { DbServiceErr } from '$lib/services/db';
import { settings } from '$lib/stores/settings.svelte';
import { nanoid } from 'nanoid/non-secure';
import { Err, Ok } from 'wellcrafted/result';
import { defineMutation } from './_client';
import { cpalRecorder } from './cpal-recorder';
import { delivery } from './delivery';
import { manualRecorder } from './manual-recorder';
import { notify } from './notify';
import { recordings } from './recordings';
import { sound } from './sound';
import { transcription } from './transcription';
import { transformations } from './transformations';
import { transformer } from './transformer';
import { vadRecorder } from './vad-recorder';

/**
 * Processes a recording through the full pipeline: save → transcribe → transform
 *
 * This function handles the complete flow from recording creation through transcription:
 * 1. Creates recording metadata and saves to database
 * 2. Handles database save errors
 * 3. Shows completion toast
 * 4. Executes transcription flow
 * 5. Applies transformation if one is selected
 */
async function processRecordingPipeline({
	blob,
	toastId,
	completionTitle,
	completionDescription,
}: {
	blob: Blob;
	toastId: string;
	completionTitle: string;
	completionDescription: string;
}) {
	const now = new Date().toISOString();
	const newRecordingId = nanoid();

	const { data: createdRecording, error: createRecordingError } =
		await recordings.createRecording.execute({
			id: newRecordingId,
			title: '',
			subtitle: '',
			createdAt: now,
			updatedAt: now,
			timestamp: now,
			transcribedText: '',
			blob,
			transcriptionStatus: 'UNPROCESSED',
		});

	if (createRecordingError) {
		notify.error.execute({
			id: toastId,
			title: '❌ Failed to save recording',
			description:
				'Your recording was captured but could not be saved to the database. Please check your storage space and permissions.',
			action: { type: 'more-details', error: createRecordingError },
		});
		return;
	}

	notify.success.execute({
		id: toastId,
		title: completionTitle,
		description: completionDescription,
	});

	const transcribeToastId = nanoid();
	notify.loading.execute({
		id: transcribeToastId,
		title: '📋 Transcribing...',
		description: 'Your recording is being transcribed...',
	});

	const { data: transcribedText, error: transcribeError } =
		await transcription.transcribeRecording.execute(createdRecording);

	if (transcribeError) {
		if (transcribeError.name === 'WhisperingError') {
			notify.error.execute({ id: transcribeToastId, ...transcribeError });
			return;
		}
		notify.error.execute({
			id: transcribeToastId,
			title: '❌ Failed to transcribe recording',
			description: 'Your recording could not be transcribed.',
			action: { type: 'more-details', error: transcribeError },
		});
		return;
	}

	sound.playSoundIfEnabled.execute('transcriptionComplete');

	await delivery.deliverTranscriptionResult.execute({
		text: transcribedText,
		toastId: transcribeToastId,
	});

	// Determine if we need to chain to transformation
	const transformationId =
		settings.value['transformations.selectedTransformationId'];

	// Check if transformation is valid if specified
	if (!transformationId) return;
	const { data: transformation, error: getTransformationError } =
		await transformations.queries
			.getTransformationById(() => transformationId)
			.fetchCached();

	const couldNotRetrieveTransformation = getTransformationError;
	const transformationNoLongerExists = !transformation;

	if (couldNotRetrieveTransformation) {
		notify.error.execute({
			id: nanoid(),
			title: '❌ Failed to get transformation',
			description:
				'Your transformation could not be retrieved. Please try again.',
			action: { type: 'more-details', error: getTransformationError },
		});
		return;
	}

	if (transformationNoLongerExists) {
		settings.value = {
			...settings.value,
			'transformations.selectedTransformationId': null,
		};
		notify.warning.execute({
			id: nanoid(),
			title: '⚠️ No matching transformation found',
			description:
				'No matching transformation found. Please select a different transformation.',
			action: {
				type: 'link',
				label: 'Select a different transformation',
				href: '/transformations',
			},
		});
		return;
	}

	const transformToastId = nanoid();
	notify.loading.execute({
		id: transformToastId,
		title: '🔄 Running transformation...',
		description:
			'Applying your selected transformation to the transcribed text...',
	});
	const { data: transformationRun, error: transformError } =
		await transformer.transformRecording.execute({
			recordingId: createdRecording.id,
			transformation,
		});
	if (transformError) {
		notify.error.execute({ id: transformToastId, ...transformError });
		return;
	}

	if (transformationRun.status === 'failed') {
		notify.error.execute({
			id: transformToastId,
			title: '⚠️ Transformation error',
			description: transformationRun.error,
			action: { type: 'more-details', error: transformationRun.error },
		});
		return;
	}

	sound.playSoundIfEnabled.execute('transformationComplete');

	await delivery.deliverTransformationResult.execute({
		text: transformationRun.output,
		toastId: transformToastId,
	});
}

// Internal mutations for manual recording
const startManualRecording = defineMutation({
	mutationKey: ['commands', 'startManualRecording'] as const,
	resultMutationFn: async () => {
		const toastId = nanoid();
		notify.loading.execute({
			id: toastId,
			title: '🎙️ Preparing to record...',
			description: 'Setting up your recording environment...',
		});
		const { data: deviceAcquisitionOutcome, error: startRecordingError } =
			await manualRecorder.startRecording.execute({
				toastId,
			});

		if (startRecordingError) {
			notify.error.execute({
				id: toastId,
				title: '❌ Failed to start recording',
				description: 'Your recording could not be started. Please try again.',
				action: { type: 'more-details', error: startRecordingError },
			});
			return Err(startRecordingError);
		}

		switch (deviceAcquisitionOutcome.outcome) {
			case 'success': {
				notify.success.execute({
					id: toastId,
					title: '🎙️ Whispering is recording...',
					description: 'Speak now and stop recording when done',
				});
				break;
			}
			case 'fallback': {
				settings.value = {
					...settings.value,
					'recording.navigator.selectedDeviceId':
						deviceAcquisitionOutcome.fallbackDeviceId,
				};
				switch (deviceAcquisitionOutcome.reason) {
					case 'no-device-selected': {
						notify.info.execute({
							id: toastId,
							title: '🎙️ Switched to available microphone',
							description:
								'No microphone was selected, so we automatically connected to an available one. You can update your selection in settings.',
							action: {
								type: 'link',
								label: 'Open Settings',
								href: '/settings/recording',
							},
						});
						break;
					}
					case 'preferred-device-unavailable': {
						notify.info.execute({
							id: toastId,
							title: '🎙️ Switched to different microphone',
							description:
								"Your previously selected microphone wasn't found, so we automatically connected to an available one.",
							action: {
								type: 'link',
								label: 'Open Settings',
								href: '/settings/recording',
							},
						});
						break;
					}
				}
			}
		}
		console.info('Recording started');
		sound.playSoundIfEnabled.execute('manual-start');
		return Ok(undefined);
	},
});

const stopManualRecording = defineMutation({
	mutationKey: ['commands', 'stopManualRecording'] as const,
	resultMutationFn: async () => {
		const toastId = nanoid();
		notify.loading.execute({
			id: toastId,
			title: '⏸️ Stopping recording...',
			description: 'Finalizing your audio capture...',
		});
		const { data: blob, error: stopRecordingError } =
			await manualRecorder.stopRecording.execute({ toastId });
		if (stopRecordingError) {
			notify.error.execute({
				id: toastId,
				title: '❌ Failed to stop recording',
				description: 'Your recording could not be stopped. Please try again.',
				action: { type: 'more-details', error: stopRecordingError },
			});
			return Err(stopRecordingError);
		}

		notify.success.execute({
			id: toastId,
			title: '🎙️ Recording stopped',
			description: 'Your recording has been saved',
		});
		console.info('Recording stopped');
		sound.playSoundIfEnabled.execute('manual-stop');

		await processRecordingPipeline({
			blob,
			toastId,
			completionTitle: '✨ Recording Complete!',
			completionDescription: 'Recording saved and session closed successfully',
		});

		return Ok(undefined);
	},
});

// Internal mutations for CPAL recording
const startCpalRecording = defineMutation({
	mutationKey: ['commands', 'startCpalRecording'] as const,
	resultMutationFn: async () => {
		const toastId = nanoid();
		notify.loading.execute({
			id: toastId,
			title: '🔊 Preparing CPAL recording...',
			description: 'Setting up native audio recording...',
		});
		const { error: startRecordingError } =
			await cpalRecorder.startRecording.execute({
				toastId,
				selectedDeviceId: settings.value['recording.cpal.selectedDeviceId'],
			});

		if (startRecordingError) {
			notify.error.execute({
				id: toastId,
				title: '❌ Failed to start CPAL recording',
				description: 'Your recording could not be started. Please try again.',
				action: { type: 'more-details', error: startRecordingError },
			});
			return Err(startRecordingError);
		}

		notify.success.execute({
			id: toastId,
			title: '🔊 CPAL is recording...',
			description: 'Speak now and stop recording when done',
		});
		console.info('CPAL Recording started');
		sound.playSoundIfEnabled.execute('cpal-start');
		return Ok(undefined);
	},
});

const stopCpalRecording = defineMutation({
	mutationKey: ['commands', 'stopCpalRecording'] as const,
	resultMutationFn: async () => {
		const toastId = nanoid();
		notify.loading.execute({
			id: toastId,
			title: '⏸️ Stopping CPAL recording...',
			description: 'Finalizing your audio capture...',
		});
		const { data: blob, error: stopRecordingError } =
			await cpalRecorder.stopRecording.execute({ toastId });
		if (stopRecordingError) {
			notify.error.execute({
				id: toastId,
				title: '❌ Failed to stop CPAL recording',
				description: 'Your recording could not be stopped. Please try again.',
				action: { type: 'more-details', error: stopRecordingError },
			});
			return Err(stopRecordingError);
		}

		notify.success.execute({
			id: toastId,
			title: '🔊 CPAL Recording stopped',
			description: 'Your recording has been saved',
		});
		console.info('CPAL Recording stopped');
		sound.playSoundIfEnabled.execute('cpal-stop');

		await processRecordingPipeline({
			blob,
			toastId,
			completionTitle: '✨ CPAL Recording Complete!',
			completionDescription: 'Recording saved and session closed successfully',
		});

		return Ok(undefined);
	},
});

export const commands = {
	// Push to talk command
	pushToTalk: defineMutation({
		mutationKey: ['commands', 'pushToTalk'] as const,
		resultMutationFn: async () => {
			const { data: recorderState, error: getRecorderStateError } =
				await manualRecorder.getRecorderState.fetchCached();
			if (getRecorderStateError) {
				notify.error.execute({
					id: nanoid(),
					title: '❌ Failed to get recorder state',
					description: 'Your recording could not be started. Please try again.',
					action: { type: 'more-details', error: getRecorderStateError },
				});
				return Err(getRecorderStateError);
			}
			if (recorderState === 'RECORDING') {
				return await stopManualRecording.execute(undefined);
			}
			return await startManualRecording.execute(undefined);
		},
	}),

	// Toggle manual recording
	toggleManualRecording: defineMutation({
		mutationKey: ['commands', 'toggleManualRecording'] as const,
		resultMutationFn: async () => {
			const { data: recorderState, error: getRecorderStateError } =
				await manualRecorder.getRecorderState.fetchCached();
			if (getRecorderStateError) {
				notify.error.execute({
					id: nanoid(),
					title: '❌ Failed to get recorder state',
					description: 'Your recording could not be started. Please try again.',
					action: { type: 'more-details', error: getRecorderStateError },
				});
				return Err(getRecorderStateError);
			}
			if (recorderState === 'RECORDING') {
				return await stopManualRecording.execute(undefined);
			}
			return await startManualRecording.execute(undefined);
		},
	}),

	// Cancel manual recording
	cancelManualRecording: defineMutation({
		mutationKey: ['commands', 'cancelManualRecording'] as const,
		resultMutationFn: async () => {
			const toastId = nanoid();
			notify.loading.execute({
				id: toastId,
				title: '⏸️ Canceling recording...',
				description: 'Cleaning up recording session...',
			});
			const { data: cancelRecordingResult, error: cancelRecordingError } =
				await manualRecorder.cancelRecording.execute({ toastId });
			if (cancelRecordingError) {
				notify.error.execute({
					id: toastId,
					title: '❌ Failed to cancel recording',
					description:
						'Your recording could not be cancelled. Please try again.',
					action: { type: 'more-details', error: cancelRecordingError },
				});
				return Err(cancelRecordingError);
			}
			switch (cancelRecordingResult.status) {
				case 'no-recording': {
					notify.info.execute({
						id: toastId,
						title: 'No active recording',
						description: 'There is no recording in progress to cancel.',
					});
					break;
				}
				case 'cancelled': {
					// Session cleanup is now handled internally by the recorder service
					notify.success.execute({
						id: toastId,
						title: '✅ All Done!',
						description: 'Recording cancelled successfully',
					});
					sound.playSoundIfEnabled.execute('manual-cancel');
					console.info('Recording cancelled');
					break;
				}
			}
			return Ok(undefined);
		},
	}),

	// Toggle VAD recording
	toggleVadRecording: defineMutation({
		mutationKey: ['commands', 'toggleVadRecording'] as const,
		resultMutationFn: async () => {
			const { data: vadState } = await vadRecorder.getVadState.fetchCached();
			if (vadState === 'LISTENING' || vadState === 'SPEECH_DETECTED') {
				const toastId = nanoid();
				console.info('Stopping voice activated capture');
				notify.loading.execute({
					id: toastId,
					title: '⏸️ Stopping voice activated capture...',
					description: 'Finalizing your voice activated capture...',
				});
				const { error: stopVadError } =
					await vadRecorder.stopActiveListening.execute(undefined);
				if (stopVadError) {
					notify.error.execute({ id: toastId, ...stopVadError });
					return Err(stopVadError);
				}
				notify.success.execute({
					id: toastId,
					title: '🎙️ Voice activated capture stopped',
					description: 'Your voice activated capture has been stopped.',
				});
				sound.playSoundIfEnabled.execute('vad-stop');
				return Ok(undefined);
			}
			const toastId = nanoid();
			console.info('Starting voice activated capture');
			notify.loading.execute({
				id: toastId,
				title: '🎙️ Starting voice activated capture',
				description: 'Your voice activated capture is starting...',
			});
			const {
				data: deviceAcquisitionOutcome,
				error: startActiveListeningError,
			} = await vadRecorder.startActiveListening.execute({
				onSpeechStart: () => {
					notify.success.execute({
						title: '🎙️ Speech started',
						description: 'Recording started. Speak clearly and loudly.',
					});
				},
				onSpeechEnd: async (blob) => {
					const toastId = nanoid();
					notify.success.execute({
						id: toastId,
						title: '🎙️ Voice activated speech captured',
						description: 'Your voice activated speech has been captured.',
					});
					console.info('Voice activated speech captured');
					sound.playSoundIfEnabled.execute('vad-capture');

					await processRecordingPipeline({
						blob,
						toastId,
						completionTitle: '✨ Voice activated capture complete!',
						completionDescription:
							'Voice activated capture complete! Ready for another take',
					});
				},
			});
			if (startActiveListeningError) {
				notify.error.execute({ id: toastId, ...startActiveListeningError });
				return Err(startActiveListeningError);
			}

			// Handle device acquisition outcome
			switch (deviceAcquisitionOutcome.outcome) {
				case 'success': {
					notify.success.execute({
						id: toastId,
						title: '🎙️ Voice activated capture started',
						description: 'Your voice activated capture has been started.',
					});
					break;
				}
				case 'fallback': {
					settings.value = {
						...settings.value,
						'recording.navigator.selectedDeviceId':
							deviceAcquisitionOutcome.fallbackDeviceId,
					};
					switch (deviceAcquisitionOutcome.reason) {
						case 'no-device-selected': {
							notify.info.execute({
								id: toastId,
								title: '🎙️ VAD started with available microphone',
								description:
									'No microphone was selected for VAD, so we automatically connected to an available one. You can update your selection in settings.',
								action: {
									type: 'link',
									label: 'Open Settings',
									href: '/settings/recording',
								},
							});
							break;
						}
						case 'preferred-device-unavailable': {
							notify.info.execute({
								id: toastId,
								title: '🎙️ VAD switched to different microphone',
								description:
									"Your previously selected VAD microphone wasn't found, so we automatically connected to an available one.",
								action: {
									type: 'link',
									label: 'Open Settings',
									href: '/settings/recording',
								},
							});
							break;
						}
					}
				}
			}

			sound.playSoundIfEnabled.execute('vad-start');
			return Ok(undefined);
		},
	}),

	// CPAL commands (conditionally included)
	...(window.__TAURI_INTERNALS__
		? {
				toggleCpalRecording: defineMutation({
					mutationKey: ['commands', 'toggleCpalRecording'] as const,
					resultMutationFn: async () => {
						const { data: recorderState, error: getRecorderStateError } =
							await cpalRecorder.getRecorderState.fetchCached();
						if (getRecorderStateError) {
							notify.error.execute({
								id: nanoid(),
								title: '❌ Failed to get CPAL recorder state',
								description:
									'Your recording could not be started. Please try again.',
								action: { type: 'more-details', error: getRecorderStateError },
							});
							return Err(getRecorderStateError);
						}
						if (recorderState === 'RECORDING') {
							return await stopCpalRecording.execute(undefined);
						}
						return await startCpalRecording.execute(undefined);
					},
				}),

				cancelCpalRecording: defineMutation({
					mutationKey: ['commands', 'cancelCpalRecording'] as const,
					resultMutationFn: async () => {
						const toastId = nanoid();
						notify.loading.execute({
							id: toastId,
							title: '⏸️ Canceling CPAL recording...',
							description: 'Cleaning up recording session...',
						});
						const { data: cancelRecordingResult, error: cancelRecordingError } =
							await cpalRecorder.cancelRecording.execute({ toastId });
						if (cancelRecordingError) {
							notify.error.execute({
								id: toastId,
								title: '❌ Failed to cancel CPAL recording',
								description:
									'Your recording could not be cancelled. Please try again.',
								action: { type: 'more-details', error: cancelRecordingError },
							});
							return Err(cancelRecordingError);
						}
						switch (cancelRecordingResult.status) {
							case 'no-recording': {
								notify.info.execute({
									id: toastId,
									title: 'No active recording',
									description:
										'There is no CPAL recording in progress to cancel.',
								});
								break;
							}
							case 'cancelled': {
								notify.success.execute({
									id: toastId,
									title: '✅ All Done!',
									description: 'CPAL recording cancelled successfully',
								});
								sound.playSoundIfEnabled.execute('cpal-cancel');
								console.info('CPAL Recording cancelled');
								break;
							}
						}
						return Ok(undefined);
					},
				}),
			}
		: {}),

	// Upload recording
	uploadRecording: defineMutation({
		mutationKey: ['recordings', 'uploadRecording'] as const,
		resultMutationFn: async ({ file }: { file: File }) => {
			// Validate file type
			if (!file.type.startsWith('audio/')) {
				return DbServiceErr({
					message: 'Invalid file type. Please upload an audio file.',
					context: { fileType: file.type },
					cause: undefined,
				});
			}

			// Create recording from uploaded file
			const arrayBuffer = await file.arrayBuffer();
			const audioBlob = new Blob([arrayBuffer], { type: file.type });

			// Use the shared pipeline directly
			const toastId = nanoid();
			await processRecordingPipeline({
				blob: audioBlob,
				toastId,
				completionTitle: '📁 File uploaded successfully!',
				completionDescription: file.name,
			});

			return Ok(undefined);
		},
	}),
};
