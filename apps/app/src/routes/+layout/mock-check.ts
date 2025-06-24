import type { UpdateInfo } from '$lib/components/UpdateDialog.svelte';
import type { DownloadEvent } from '@tauri-apps/plugin-updater';

/**
 * Mock update check for testing the auto-update functionality.
 *
 * This mock simulates the behavior of the Tauri updater plugin's check() function,
 * allowing you to test the update UI flow without needing an actual update server.
 *
 * @example
 * ```typescript
 * // To enable mock updates during development:
 * // 1. Set VITE_MOCK_UPDATES=true in your .env.local file
 * // 2. Or use URL parameter: http://localhost:5173/?mockUpdates=true
 *
 * const update = await (shouldUseMock ? mockCheck() : check());
 * ```
 *
 * @returns A mock Update object that simulates a real update with:
 * - Version 2.0.0 available
 * - Realistic download progress simulation (50MB over 5 seconds)
 * - Sample release notes in markdown format
 */
export async function mockCheck(): Promise<UpdateInfo> {
	// Simulate network delay for realism
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Optionally return null to test "no update available" scenario
	// Uncomment the line below to test this case:
	// return null;

	// Return mock update data that matches the full Update type
	return {
		version: '2.0.0',
		date: new Date().toISOString(),
		body: `## What's New in v2.0.0

### 🚀 Features
- Added automatic update checking on app startup
- Improved performance by 50% through optimized audio processing
- New dark mode theme options with better contrast
- Enhanced keyboard shortcuts for faster workflow
- Added progress indicators for long-running operations

### 🐛 Bug Fixes
- Fixed audio recording issues on macOS Sonoma
- Resolved memory leak in long recording sessions
- Fixed UI glitches in settings panel
- Corrected text overflow in transcription results
- Fixed crash when switching audio devices

### 💔 Breaking Changes
- Minimum macOS version is now 11.0 (Big Sur)
- Changed default recording hotkey to Cmd+Shift+R
- Removed deprecated API endpoints

### 📝 Notes
This is a mock update for testing purposes. The actual update
process would download and install real application files.`,
		/**
		 * Mock download and install function that simulates real update behavior
		 */
		downloadAndInstall: async (
			progressCallback?: (event: DownloadEvent) => void,
		) => {
			// Simulate download progress
			const totalSize = 50 * 1024 * 1024; // 50MB
			let downloaded = 0;

			// Emit Started event
			progressCallback?.({
				event: 'Started',
				data: { contentLength: totalSize },
			});

			// Simulate download in chunks
			for (let i = 0; i < 10; i++) {
				// Check if we should simulate an error (uncomment to test error handling)
				// if (i === 5) throw new Error('Network connection lost');

				await new Promise((resolve) => setTimeout(resolve, 500));
				const chunkSize = totalSize / 10;
				downloaded += chunkSize;

				progressCallback?.({
					event: 'Progress',
					data: { chunkLength: chunkSize },
				});
			}

			// Emit Finished event
			progressCallback?.({ event: 'Finished' });
		},
	};
}

/**
 * Determines whether to use mock updates based on environment.
 *
 * @returns true if mock updates should be used, false otherwise
 */
export function shouldUseMockUpdates(): boolean {
	return import.meta.env.DEV;
}
