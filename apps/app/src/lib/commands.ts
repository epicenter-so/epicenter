import { recorder } from '$lib/query/recorder';
import { recordings } from '$lib/query/recordings';
import { maybeCopyAndPaste } from '$lib/query/singletons/maybeCopyAndPaste';
import { transcription } from '$lib/query/transcription';
import { transformer } from '$lib/query/transformer';
import { vadRecorder } from '$lib/query/vadRecorder';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { nanoid } from 'nanoid/non-secure';
import { playSoundIfEnabled, services } from './services';

const stopManualRecording = async () => {
	const toastId = nanoid();
	toast.loading({
		id: toastId,
		title: '⏸️ Stopping recording...',
		description: 'Finalizing your audio capture...',
	});
	const { data: blob, error: stopRecordingError } =
		await recorder.stopRecording.execute({ toastId });
	if (stopRecordingError) {
		toast.error({
			id: toastId,
			title: '❌ Failed to stop recording',
			description: 'Your recording could not be stopped. Please try again.',
			action: { type: 'more-details', error: stopRecordingError },
		});
		return;
	}
	toast.success({
		id: toastId,
		title: '🎙️ Recording stopped',
		description: 'Your recording has been saved',
	});
	console.info('Recording stopped');
	playSoundIfEnabled('manual-stop');

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
		toast.error({
			id: toastId,
			title: '❌ Failed to save recording',
			description:
				'Your recording was captured but could not be saved to the database. Please check your storage space and permissions.',
			action: { type: 'more-details', error: createRecordingError },
		});
		return;
	}

	toast.loading({
		id: toastId,
		title: '✨ Recording Complete!',
		description: settings.value['recording.isFasterRerecordEnabled']
			? 'Recording saved! Ready for another take'
			: 'Recording saved and session closed successfully',
	});

	if (!settings.value['recording.isFasterRerecordEnabled']) {
		toast.loading({
			id: toastId,
			title: '⏳ Closing recording session...',
			description: 'Wrapping things up, just a moment...',
		});

		const { error: closeRecordingSessionError } =
			await services.recorder.closeRecordingSession({
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

	const transcribeToastId = nanoid();
	toast.loading({
		id: transcribeToastId,
		title: '📋 Transcribing...',
		description: 'Your recording is being transcribed...',
	});
	const { data: transcribedText, error: transcribeError } =
		await transcription.transcribeRecording.execute(createdRecording);

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

	toast.success({
		id: transcribeToastId,
		title: 'Transcribed recording!',
		description: 'Your recording has been transcribed.',
	});
	maybeCopyAndPaste({
		text: transcribedText,
		toastId,
		shouldCopy: settings.value['transcription.clipboard.copyOnSuccess'],
		shouldPaste: settings.value['transcription.clipboard.pasteOnSuccess'],
		statusToToastText(status) {
			switch (status) {
				case null:
					return '📝 Recording transcribed!';
				case 'COPIED':
					return '📝 Recording transcribed and copied to clipboard!';
				case 'COPIED+PASTED':
					return '📝📋✍️ Recording transcribed, copied to clipboard, and pasted!';
			}
		},
	});
	if (settings.value['transformations.selectedTransformationId']) {
		const transformToastId = nanoid();
		await transformer.transformRecording.execute({
			recordingId: createdRecording.id,
			transformationId:
				settings.value['transformations.selectedTransformationId'],
			toastId: transformToastId,
		});
	}
};

const startManualRecording = async () => {
	const toastId = nanoid();
	toast.loading({
		id: toastId,
		title: '🎙️ Preparing to record...',
		description: 'Setting up your recording environment...',
	});
	const { error: startRecordingError } = await recorder.startRecording.execute({
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
	playSoundIfEnabled('manual-start');
};

export const commands = [
	{
		id: 'toggleManualRecording',
		title: 'Toggle manual recording',
		defaultLocalShortcut: 'space',
		defaultGlobalShortcut: 'CommandOrControl+Shift+{',
		callback: async () => {
			const { data: recorderState, error: getRecorderStateError } =
				await recorder.getRecorderState.fetchCached();
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
				await recorder.cancelRecording.execute({ toastId });
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
					await recorder.closeRecordingSession.execute({
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
				playSoundIfEnabled('manual-cancel');
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
				await recorder.closeRecordingSession.execute({
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
			const { data: vadState } = await vadRecorder.getVadState.fetchCached();
			if (vadState === 'SESSION+RECORDING') {
				const toastId = nanoid();
				toast.loading({
					id: toastId,
					title: '⏸️ Stopping voice activated capture...',
					description: 'Finalizing your voice activated capture...',
				});
				const { error: stopVadError } =
					await vadRecorder.stopVad.execute(undefined);
				if (stopVadError) {
					toast.error({ id: toastId, ...stopVadError });
				}
			} else {
				vadRecorder.startActiveListening.execute(undefined);
			}
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
