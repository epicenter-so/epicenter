import type { RecordingMode } from '$lib/constants/audio';
import { rpc } from '$lib/query';
import * as services from '$lib/services';
import { settings as settingsStore } from '$lib/stores/settings.svelte';
import { nanoid } from 'nanoid/non-secure';
import { Ok } from 'wellcrafted/result';
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
		{
			mode: 'cpal' as const,
			isActive: () =>
				services.cpalRecorder.getRecorderState().data === 'RECORDING',
			stop: () =>
				services.cpalRecorder.stopRecording({
					sendStatus: () => {}, // Silent cancel - no UI notifications
				}),
		},
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
