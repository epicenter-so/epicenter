import {
	deliverTranscribedText,
	deliverTransformedText,
} from './deliverTextToUser';
import { rpc } from '$lib/query';
import { settings } from '$lib/stores/settings.svelte';
import { toast } from '$lib/toast';
import { nanoid } from 'nanoid/non-secure';
import { services } from './services';

const stopManualRecording = async () => {
	const toastId = nanoid();
	toast.loading({
		id: toastId,
		title: '⏸️ Stopping recording...',
		description: 'Finalizing your audio capture...',
	});
	const { data: blob, error: stopRecordingError } =
		await rpc.recorder.stopRecording.execute({ toastId });
	if (stopRecordingError) {
		toast.error({
			id: toastId,
			title: '❌ Failed to stop recording',
			description: 'Your recording could not be stopped. Please try again.',
			action: { type: 'more-details', error: stopRecordingError },
		});
		return;
	}
	if (!settings.value['recording.isFasterRerecordEnabled']) {
		toast.loading({
			id: toastId,
			title: '⏳ Closing recording session...',
			description: 'Wrapping things up, just a moment...',
		});

		const { error: closeRecordingSessionError } =
			await rpc.recorder.closeRecordingSession.execute({
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			});

		if (closeRecordingSessionError) {
			toast.warning({
				id: toastId,
				title: '⚠️ Unable to close session after recording',
				description:
					'You might need to restart the application to continue recording',
				action: {
					type: 'more-details',
					error: closeRecordingSessionError,
				},
			});
		} else {
			toast.success({
				id: toastId,
				title: '✨ Session Closed Successfully',
				description: 'Your recording session has been neatly wrapped up',
			});
		}
	}

	toast.success({
		id: toastId,
		title: '🎙️ Recording stopped',
		description: 'Your recording has been saved',
	});
	console.info('Recording stopped');
	services.sound.playSoundIfEnabled('manual-stop');

	await saveRecordingAndTranscribeTransform({
		blob,
		toastId,
		completionTitle: '✨ Recording Complete!',
		completionDescription: settings.value['recording.isFasterRerecordEnabled']
			? 'Recording saved! Ready for another take'
			: 'Recording saved and session closed successfully',
	});
};

const startManualRecording = async () => {
	const toastId = nanoid();
	toast.loading({
		id: toastId,
		title: '🎙️ Preparing to record...',
		description: 'Setting up your recording environment...',
	});
	const { error: startRecordingError } =
		await rpc.recorder.startRecording.execute({
			toastId,
			settings: {
				selectedAudioInputDeviceId:
					settings.value['recording.navigator.selectedAudioInputDeviceId'],
				bitrateKbps: settings.value['recording.navigator.bitrateKbps'],
			},
		});
	if (startRecordingError) {
		toast.error({
			id: toastId,
			title: '❌ Failed to start recording',
			description: 'Your recording could not be started. Please try again.',
			action: { type: 'more-details', error: startRecordingError },
		});
		return;
	}
	toast.success({
		id: toastId,
		title: '🎙️ Whispering is recording...',
		description: 'Speak now and stop recording when done',
	});
	console.info('Recording started');
	services.sound.playSoundIfEnabled('manual-start');
};

export const commands = [
	{
		id: 'toggleManualRecording',
		title: 'Toggle manual recording',
		defaultLocalShortcut: 'space',
		defaultGlobalShortcut: 'CommandOrControl+Shift+{',
		callback: async () => {
			const { data: recorderState, error: getRecorderStateError } =
				await rpc.recorder.getRecorderState.fetchCached();
			if (getRecorderStateError) {
				toast.error({
					id: nanoid(),
					title: '❌ Failed to get recorder state',
					description: 'Your recording could not be started. Please try again.',
					action: { type: 'more-details', error: getRecorderStateError },
				});
				return;
			}
			if (recorderState === 'SESSION+RECORDING') {
				await stopManualRecording();
			} else {
				await startManualRecording();
			}
		},
	},
	{
		id: 'cancelManualRecording',
		title: 'Cancel manual recording',
		defaultLocalShortcut: 'c',
		defaultGlobalShortcut: 'CommandOrControl+Shift+}',
		callback: async () => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '⏸️ Canceling recording...',
				description: 'Cleaning up recording session...',
			});
			const { error: cancelRecordingError } =
				await rpc.recorder.cancelRecording.execute({ toastId });
			if (cancelRecordingError) {
				toast.error({
					id: toastId,
					title: '❌ Failed to cancel recording',
					description:
						'Your recording could not be cancelled. Please try again.',
					action: { type: 'more-details', error: cancelRecordingError },
				});
				return;
			}
			if (settings.value['recording.isFasterRerecordEnabled']) {
				toast.success({
					id: toastId,
					title: '🚫 Recording Cancelled',
					description:
						'Recording discarded, but session remains open for a new take',
				});
			} else {
				const { error: closeRecordingSessionError } =
					await rpc.recorder.closeRecordingSession.execute({
						sendStatus: (options) => toast.loading({ id: toastId, ...options }),
					});
				if (closeRecordingSessionError) {
					toast.error({
						id: toastId,
						title: '❌ Failed to close session while cancelling recording',
						description:
							'Your recording was cancelled but we encountered an issue while closing your session. You may need to restart the application.',
						action: {
							type: 'more-details',
							error: closeRecordingSessionError,
						},
					});
					return;
				}
				toast.success({
					id: toastId,
					title: '✅ All Done!',
					description: 'Recording cancelled and session closed successfully',
				});
				services.sound.playSoundIfEnabled('manual-cancel');
				console.info('Recording cancelled');
			}
		},
	},
	{
		id: 'closeManualRecordingSession',
		title: 'Close manual recording session',
		defaultLocalShortcut: 'shift+c',
		defaultGlobalShortcut: 'CommandOrControl+Shift+\\',
		callback: async () => {
			const toastId = nanoid();
			const { error: closeRecordingSessionError } =
				await rpc.recorder.closeRecordingSession.execute({
					sendStatus: (status) => toast.info({ id: toastId, ...status }),
				});
			if (closeRecordingSessionError) {
				toast.error({
					id: toastId,
					title: '❌ Failed to close session',
					description: 'Your session could not be closed. Please try again.',
					action: { type: 'more-details', error: closeRecordingSessionError },
				});
			}
		},
	},
	{
		id: 'pushToTalk',
		title: 'Push to talk',
		defaultLocalShortcut: 'p',
		defaultGlobalShortcut: 'CommandOrControl+Shift+;',
		callback: () => {
			alert('TODO: Implement push to talk');
		},
	},
	{
		id: 'toggleVadRecording',
		title: 'Toggle vad recording',
		defaultLocalShortcut: 'v',
		defaultGlobalShortcut: "CommandOrControl+Shift+'",
		callback: async () => {
			const { data: vadState } =
				await rpc.vadRecorder.getVadState.fetchCached();
			if (vadState === 'SESSION+RECORDING') {
				const toastId = nanoid();
				toast.loading({
					id: toastId,
					title: '⏸️ Stopping voice activated capture...',
					description: 'Finalizing your voice activated capture...',
				});
				const { error: stopVadError } =
					await rpc.vadRecorder.stopVad.execute(undefined);
				if (stopVadError) {
					toast.error({ id: toastId, ...stopVadError });
				}
				return;
			}
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '🎙️ Starting voice activated capture',
				description: 'Your voice activated capture is starting...',
			});
			const { error: startActiveListeningError } =
				await rpc.vadRecorder.startActiveListening.execute({
					onSpeechEnd: async (blob) => {
						const toastId = nanoid();
						toast.success({
							id: toastId,
							title: '🎙️ Voice activated speech captured',
							description: 'Your voice activated speech has been captured.',
						});
						console.info('Voice activated speech captured');
						services.sound.playSoundIfEnabled('vad-capture');

						await saveRecordingAndTranscribeTransform({
							blob,
							toastId,
							completionTitle: '✨ Voice activated capture complete!',
							completionDescription:
								'Voice activated capture complete! Ready for another take',
						});
					},
				});
			if (startActiveListeningError) {
				toast.error({ id: toastId, ...startActiveListeningError });
				return;
			}
			toast.success({
				id: toastId,
				title: '🎙️ Voice activated capture started',
				description: 'Your voice activated capture has been started.',
			});
		},
	},
] as const;

export type Command = (typeof commands)[number];

type CommandCallbacks = Record<Command['id'], Command['callback']>;

export const commandCallbacks = commands.reduce<CommandCallbacks>(
	(acc, command) => {
		acc[command.id] = command.callback;
		return acc;
	},
	{} as CommandCallbacks,
);

/**
 * Saves a recording blob to the database and immediately transcribes it.
 *
 * This function handles the complete flow from recording creation through transcription:
 * 1. Creates recording metadata and saves to database
 * 2. Handles database save errors
 * 3. Shows completion toast
 * 4. Executes transcription flow
 * 5. Applies transformation if one is selected
 *
 * @param blob - The audio blob to save
 * @param toastId - Toast ID for consistent notifications
 * @param completionTitle - Title for the completion toast
 * @param completionDescription - Description for the completion toast
 */
async function saveRecordingAndTranscribeTransform({
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
		await rpc.recordings.createRecording.execute({
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
		toast.error({
			id: toastId,
			title: '❌ Failed to save recording',
			description:
				'Your recording was captured but could not be saved to the database. Please check your storage space and permissions.',
			action: { type: 'more-details', error: createRecordingError },
		});
		return;
	}

	toast.success({
		id: toastId,
		title: completionTitle,
		description: completionDescription,
	});

	const transcribeToastId = nanoid();
	toast.loading({
		id: transcribeToastId,
		title: '📋 Transcribing...',
		description: 'Your recording is being transcribed...',
	});

	const { data: transcribedText, error: transcribeError } =
		await rpc.transcription.transcribeRecording.execute(createdRecording);

	if (transcribeError) {
		if (transcribeError.name === 'WhisperingError') {
			toast.error({ id: transcribeToastId, ...transcribeError });
			return;
		}
		toast.error({
			id: transcribeToastId,
			title: '❌ Failed to transcribe recording',
			description: 'Your recording could not be transcribed.',
			action: { type: 'more-details', error: transcribeError },
		});
		return;
	}

	services.sound.playSoundIfEnabled('transcriptionComplete');

	await deliverTranscribedText({ text: transcribedText, toastId });

	// Determine if we need to chain to transformation
	const needsTransformation =
		settings.value['transformations.selectedTransformationId'];

	// Check if transformation is valid if specified
	if (needsTransformation) {
		const { data: transformation, error: getTransformationError } =
			await services.db.getTransformationById(needsTransformation);

		const couldNotRetrieveTransformation = getTransformationError;
		const transformationNoLongerExists = !transformation;

		if (couldNotRetrieveTransformation) {
			toast.error({
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
			toast.warning({
				id: nanoid(),
				title: '⚠️ No matching transformation found',
				description:
					'No matching transformation found. Please select a different transformation.',
				action: {
					type: 'link',
					label: 'Select a different transformation',
					goto: '/transformations',
				},
			});
			return;
		}

		const transformToastId = nanoid();
		toast.loading({
			id: transformToastId,
			title: '🔄 Running transformation...',
			description:
				'Applying your selected transformation to the transcribed text...',
		});
		const { data: transformationRun, error: transformError } =
			await rpc.transformer.transformRecording.execute({
				recordingId: createdRecording.id,
				transformationId: needsTransformation,
			});
		if (transformError) {
			toast.error({ id: transformToastId, ...transformError });
			return;
		}

		if (transformationRun.status === 'failed') {
			toast.error({
				id: transformToastId,
				title: '⚠️ Transformation error',
				description: transformationRun.error,
				action: { type: 'more-details', error: transformationRun.error },
			});
			return;
		}

		services.sound.playSoundIfEnabled('transformationComplete');

		await deliverTransformedText({ text: transformationRun.output, toastId });
	}
}
