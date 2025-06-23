import { createHttpServiceDesktop } from './desktop';
import { createHttpServiceWeb } from './web';

export type {
	ConnectionError,
	HttpService,
	HttpServiceError,
	ParseError,
	ResponseError,
} from './types';

export const HttpServiceLive = window.__TAURI_INTERNALS__
	? createHttpServiceDesktop()
	: createHttpServiceWeb();
