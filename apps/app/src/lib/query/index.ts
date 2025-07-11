// Re-export queryClient for backward compatibility
export { queryClient } from './_client';

// Import all query modules
import { clipboard } from './clipboard';
import { cpalRecorder } from './cpal-recorder';
import { delivery } from './delivery';
import { device } from './device';
import { download } from './download';
import { manualRecorder } from './manual-recorder';
import { notify } from './notify';
import { recordings } from './recordings';
import { settings } from './settings';
import { shortcuts } from './shortcuts';
import { sound } from './sound';
import { transcription } from './transcription';
import { transformationRuns } from './transformation-runs';
import { transformations } from './transformations';
import { transformer } from './transformer';
import { tray } from './tray';
import { vadRecorder } from './vad-recorder';

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
