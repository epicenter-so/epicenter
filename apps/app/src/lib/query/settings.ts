import type { RecordingMode } from '$lib/constants/audio';
import { rpc } from '$lib/query';
import * as services from '$lib/services';
import type { ManualRecorderServiceError } from '$lib/services/manual-recorder';
import type { VadRecorderServiceError } from '$lib/services/vad-recorder';
import { settings as settingsStore } from '$lib/stores/settings.svelte';
import { nanoid } from 'nanoid/non-secure';
import type { TaggedError } from 'wellcrafted/error';
import { Err, Ok, type Result, partitionResults } from 'wellcrafted/result';
import { defineMutation } from './_utils';

/**
 * Centralized settings mutations that ensure consistent behavior across the application.
 *
 * This module provides a single source of truth for settings-related operations that
 * require additional logic or side effects beyond simple value updates.
 *
 * Key responsibilities:
 * - Enforcing business rules when settings change (e.g., stopping active recordings when switching modes)
 * - Providing atomic operations that combine multiple related changes
 * - Ensuring UI feedback and notifications are consistent
 *
 * Example: When switching recording modes, we always stop any active recordings first
 * to prevent conflicts between different recording systems.
 */
export const settings = {
	/**
	 * Switches the recording mode and automatically stops any active recordings.
	 * This ensures a clean transition between recording modes.
	 */
	switchRecordingMode: defineMutation({
		mutationKey: ['settings', 'switchRecordingMode'],
		resultMutationFn: async (newMode: RecordingMode) => {
			const toastId = nanoid();

			// First, stop all active recordings except the new mode
			const { errs } = await stopAllRecordingModesExcept(newMode);

			if (errs.length > 0) {
				// Even if stopping fails, we should still switch modes
				console.error('Failed to stop active recordings:', errs);
				rpc.notify.warning.execute({
					id: toastId,
					title: '⚠️ Recording may still be active',
					description:
						'Previous recording could not be stopped automatically. Please stop it manually.',
				});
			}

			// Update the settings
			settingsStore.value = {
				...settingsStore.value,
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
	}),
};

/**
 * Ensures only one recording mode is active at a time by stopping all other modes.
 * This prevents conflicts between different recording methods and ensures clean transitions.
 *
 * @returns Object containing array of errors that occurred while stopping recordings
 */
async function stopAllRecordingModesExcept(modeToKeep: RecordingMode) {
	// Each recording mode with its check and stop logic
	const recordingModes = [
		{
			mode: 'manual' as const,
			isActive: () =>
				services.manualRecorder.getRecorderState().data === 'RECORDING',
			stop: () =>
				services.manualRecorder.stopRecording({
					sendStatus: () => {}, // Silent cancel - no UI notifications
				}),
		},
		{
			mode: 'vad' as const,
			isActive: () => services.vad.getVadState() !== 'IDLE',
			stop: () => services.vad.stopActiveListening(),
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

	// Filter to modes that need to be stopped
	const modesToStop = recordingModes.filter(
		(recordingMode) =>
			recordingMode.mode !== modeToKeep && recordingMode.isActive(),
	);

	// Create promises that wrap each stop call in try-catch
	const stopPromises = modesToStop.map(
		async (recordingMode) => await recordingMode.stop(),
	);

	// Execute all stops in parallel
	const results: Result<
		Blob | undefined,
		ManualRecorderServiceError | VadRecorderServiceError
	>[] = await Promise.all(stopPromises);

	// Partition results into successes and errors
	const { errs } = partitionResults(results);

	return { errs };
}
