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
import { cpalRecorder } from './cpalRecorder';
import { device } from './device';
import { download } from './download';
import { manualRecorder } from './manualRecorder';
import { recordings } from './recordings';
import { shortcuts } from './shortcuts';
import { transcription } from './transcription';
import { transformationRuns } from './transformationRuns';
import { transformations } from './transformations';
import { transformer } from './transformer';
import { vadRecorder } from './vadRecorder';
import { sound } from './sound';

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
	shortcuts,
	sound,
	transcription,
	transformations,
	transformationRuns,
	transformer,
};
