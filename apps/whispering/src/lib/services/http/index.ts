import { createHttpServiceDesktop } from './desktop';
import { createHttpServiceWeb } from './web';

export type { HttpService, HttpServiceError } from './types';

// Re-export both types and factory functions
export type { ConnectionError, ParseError, ResponseError } from './types';
export {
	ConnectionErr,
	ConnectionError,
	ParseErr,
	ParseError,
	ResponseErr,
	ResponseError,
} from './types';

export const HttpServiceLive = window.__TAURI_INTERNALS__
	? createHttpServiceDesktop()
	: createHttpServiceWeb();
