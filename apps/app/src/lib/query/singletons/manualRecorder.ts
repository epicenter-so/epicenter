import { toast } from '$lib/services/toast';
import {
	createResultMutation,
	createResultQuery,
} from '@tanstack/svelte-query';
import { noop } from '@tanstack/table-core';
import { nanoid } from 'nanoid/non-secure';
import { getContext, setContext } from 'svelte';
import { recorder } from '../recorder';

export type ManualRecorder = ReturnType<typeof createManualRecorder>;

export const initManualRecorderInContext = () => {
	const manualRecorder = createManualRecorder();
	setContext('manualRecorder', manualRecorder);
	return manualRecorder;
};

export const getManualRecorderFromContext = () => {
	return getContext<ManualRecorder>('manualRecorder');
};

function createManualRecorder() {
	const recorderState = createResultQuery(recorder.getRecorderState);
	const closeRecordingSession = createResultMutation(
		recorder.closeRecordingSession,
	);

	return {
		closeRecordingSessionSilent: () => {
			const toastId = nanoid();
			closeRecordingSession.mutate(
				{ sendStatus: noop },
				{
					onError: (error) => {
						toast.error({
							id: toastId,
							title: '❌ Failed to close session',
							description:
								'Your session could not be closed. Please try again.',
							action: { type: 'more-details', error: error },
						});
					},
				},
			);
		},
	};
}
