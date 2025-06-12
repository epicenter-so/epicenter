import { QueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			enabled: browser,
		},
	},
});

// Import all query modules
import { clipboard } from './_queries/clipboard';
import { download } from './_queries/download';
import { recorder } from './_queries/recorder';
import { recordings } from './_queries/recordings';
import { shortcuts } from './_queries/shortcuts';
import { transcription } from './_queries/transcription';
import { transformations } from './_queries/transformations';
import { transformationRuns } from './_queries/transformationRuns';
import { transformer } from './_queries/transformer';
import { vadRecorder } from './_queries/vadRecorder';

/**
 * Unified namespace for all query operations.
 * Provides a single entry point for all TanStack Query-based operations.
 */
export const rpc = {
	clipboard,
	download,
	recorder,
	recordings,
	shortcuts,
	transcription,
	transformations,
	transformationRuns,
	transformer,
	vadRecorder,
};
