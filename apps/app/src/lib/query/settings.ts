import type { RecordingMode } from '$lib/constants/audio';
import { rpc } from '$lib/query';
import * as services from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { nanoid } from 'nanoid/non-secure';
import { Ok } from 'wellcrafted/result';
import { defineMutation } from './_utils';

/**
 * Switches the recording mode and automatically stops any active recordings.
 * This ensures a clean transition between recording modes.
 */
export const switchRecordingMode = defineMutation({
	mutationKey: ['settings', 'switchRecordingMode'],
	resultMutationFn: async (newMode: RecordingMode) => {
		const toastId = nanoid();

		// First, stop all active recordings except the new mode
		try {
			await stopAllRecordingModesExcept(newMode);
		} catch (error) {
			// Even if stopping fails, we should still switch modes
			console.error('Failed to stop active recordings:', error);
			rpc.notify.warning.execute({
				id: toastId,
				title: '⚠️ Recording may still be active',
				description:
					'Previous recording could not be stopped automatically. Please stop it manually.',
			});
		}

		// Update the settings
		settings.value = {
			...settings.value,
			'recording.mode': newMode,
		};

		// Show success notification
		rpc.notify.success.execute({
			id: toastId,
			title: '✅ Recording mode switched',
			description: `Switched to ${newMode} recording mode`,
		});

		return Ok(newMode);
	},
});

/**
 * Ensures only one recording mode is active at a time by stopping all other modes.
 * This prevents conflicts between different recording methods and ensures clean transitions.
 */
async function stopAllRecordingModesExcept(
	modeToKeep: RecordingMode,
): Promise<void> {
	// Each recording mode with its check and stop logic
	const recordingModes = [
		{
			mode: 'vad' as const,
			isActive: () => services.vad.getVadState() !== 'IDLE',
			stop: () => services.vad.stopActiveListening(),
		},
		{
			mode: 'manual' as const,
			isActive: () =>
				services.manualRecorder.getRecorderState().data === 'RECORDING',
			stop: () =>
				services.manualRecorder.stopRecording({
					sendStatus: () => {}, // Silent cancel - no UI notifications
				}),
		},
		// {
		// 	mode: 'cpal' as const,
		// 	isActive: () =>
		// 		services.cpalRecorder.getRecorderState().data === 'RECORDING',
		// 	stop: () =>
		// 		services.cpalRecorder.stopRecording({
		// 			sendStatus: () => {}, // Silent cancel - no UI notifications
		// 		}),
		// },
	] satisfies {
		mode: RecordingMode;
		isActive: () => boolean;
		stop: () => Promise<unknown>;
	}[];

	// Stop all modes except the one to keep
	for (const recordingMode of recordingModes) {
		if (recordingMode.mode === modeToKeep) continue;

		if (recordingMode.isActive()) {
			await recordingMode.stop();
		}
	}
}
