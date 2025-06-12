import { services } from '$lib/services';
import { toast } from '$lib/toast';
import { settings } from '$lib/stores/settings.svelte';
import { nanoid } from 'nanoid/non-secure';
import { deliverTextToUser } from './deliverTextToUser';
import { rpc } from './query';

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
export async function saveRecordingAndTranscribe({
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

		// Valid transformation found - will run after transcription success
	}

	// Handle transcription success
	await handleTranscriptionSuccess({
		text: transcribedText,
		toastId: transcribeToastId,
	});

	// Run transformation if one was configured and validated
	if (needsTransformation) {
		const transformToastId = nanoid();
		await rpc.transformer.transformRecording.execute({
			recordingId: createdRecording.id,
			transformationId: needsTransformation,
			toastId: transformToastId,
		});
	}
}

/**
 * Handles successful transcription completion.
 *
 * This function manages the transcription success flow:
 * 1. Shows transcription success toast
 * 2. Delivers text to user based on their clipboard preferences
 *
 * @param text - The transcribed text
 * @param toastId - Toast ID for consistent notifications
 */
async function handleTranscriptionSuccess({
	text,
	toastId,
}: {
	text: string;
	toastId: string;
}) {
	// Show transcription success toast
	toast.success({
		id: toastId,
		title: 'Transcribed recording!',
		description: 'Your recording has been transcribed.',
	});

	// Deliver transcribed text to user
	await deliverTextToUser({
		text,
		toastId,
		userWantsClipboardCopy:
			settings.value['transcription.clipboard.copyOnSuccess'],
		userWantsCursorPaste:
			settings.value['transcription.clipboard.pasteOnSuccess'],
		statusToToastText: (status) => {
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
}
