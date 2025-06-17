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
import { clipboard } from './_queries/clipboard';
import { cpalRecorder } from './_queries/cpalRecorder';
import { device } from './_queries/device';
import { download } from './_queries/download';
import { manualRecorder } from './_queries/manualRecorder';
import { recordings } from './_queries/recordings';
import { shortcuts } from './_queries/shortcuts';
import { transcription } from './_queries/transcription';
import { transformationRuns } from './_queries/transformationRuns';
import { transformations } from './_queries/transformations';
import { transformer } from './_queries/transformer';
import { vadRecorder } from './_queries/vadRecorder';

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
	transcription,
	transformations,
	transformationRuns,
	transformer,
};
