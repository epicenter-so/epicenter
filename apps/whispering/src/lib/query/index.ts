// Import all query modules
import { analytics } from './analytics';
import { commands } from './commands';
import { delivery } from './delivery';
import { download } from './download';
import { ffmpeg } from './ffmpeg';
import { notify } from './notify';
import { recorder } from './recorder';
import { recordings } from './recordings';
import { settings } from './settings';
import { shortcuts } from './shortcuts';
import { sound } from './sound';
import { text } from './text';
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
	analytics,
	commands,
	delivery,
	download,
	ffmpeg,
	notify,
	recorder,
	recordings,
	settings,
	shortcuts,
	sound,
	text,
	transcription,
	transformationRuns,
	transformations,
	transformer,
	tray,
	vadRecorder,
};
