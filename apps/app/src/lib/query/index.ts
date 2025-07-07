import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/svelte-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			enabled: browser,
		},
	},
});

// Import all query modules
import { clipboard } from './clipboard';
import { cpalRecorder } from './cpal-recorder';
import { device } from './device';
import { download } from './download';
import { manualRecorder } from './manual-recorder';
import { recordings } from './recordings';
import { tray } from './tray';
import { shortcuts } from './shortcuts';
import { transcription } from './transcription';
import { transformationRuns } from './transformation-runs';
import { transformations } from './transformations';
import { transformer } from './transformer';
import { vadRecorder } from './vad-recorder';
import { sound } from './sound';
import { notify } from './notify';
import { delivery } from './delivery';
import { settings } from './settings';

/**
 * Unified namespace for all query operations.
 * Provides a single entry point for all TanStack Query-based operations.
 */
export const rpc = {
	clipboard,
	cpalRecorder,
	device,
	download,
	manualRecorder,
	vadRecorder,
	recordings,
	tray,
	shortcuts,
	sound,
	transcription,
	transformations,
	transformationRuns,
	transformer,
	notify,
	delivery,
	settings,
};
