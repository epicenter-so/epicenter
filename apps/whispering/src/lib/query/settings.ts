import type { RecordingMode } from '$lib/constants/audio';
import type { RecorderServiceError } from '$lib/services/recorder';
import type { VadRecorderServiceError } from '$lib/services/vad-recorder';

import { rpc } from '$lib/query';
import * as services from '$lib/services';
import { settings as settingsStore } from '$lib/stores/settings.svelte';
import { nanoid } from 'nanoid/non-secure';
import { Ok, partitionResults, type Result } from 'wellcrafted/result';

import { defineMutation } from './_client';
import { recorderService } from './recorder';

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
					title: '⚠️ Recording may still be active',
					description:
						'Previous recording could not be stopped automatically. Please stop it manually.',
					id: toastId,
				});
			}

			// Update the settings if not already in new mode
			if (settingsStore.value['recording.mode'] !== newMode) {
				settingsStore.updateKey('recording.mode', newMode);

				// Show success notification
				rpc.notify.success.execute({
					title: '✅ Recording mode switched',
					description: `Switched to ${newMode} recording mode`,
					id: toastId,
				});
			}

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
	const { data: currentRecordingId } =
		await recorderService().getCurrentRecordingId();
	// Each recording mode with its check and stop logic
	const recordingModes = [
		{
			isActive: () => currentRecordingId === 'RECORDING',
			mode: 'manual' as const,
			stop: () =>
				recorderService().stopRecording({
					sendStatus: () => {}, // Silent cancel - no UI notifications
				}),
		},
		{
			isActive: () => services.vad.getVadState() !== 'IDLE',
			mode: 'vad' as const,
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
		isActive: () => boolean;
		mode: RecordingMode;
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
		RecorderServiceError | VadRecorderServiceError
	>[] = await Promise.all(stopPromises);

	// Partition results into successes and errors
	const { errs } = partitionResults(results);

	return { errs };
}
