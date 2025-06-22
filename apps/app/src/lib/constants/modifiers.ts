import { os } from '$lib/services';

export const CommandOrControl = os.type() === 'macos' ? 'Command' : 'Control';

export const CommandOrAlt = os.type() === 'macos' ? 'Command' : 'Alt';
