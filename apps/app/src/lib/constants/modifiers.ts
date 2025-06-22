import * as services from '$lib/services';

export const CommandOrControl =
	services.os.type() === 'macos' ? 'Command' : 'Control';

export const CommandOrAlt = services.os.type() === 'macos' ? 'Command' : 'Alt';
