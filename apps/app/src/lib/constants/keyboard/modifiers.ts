import { IS_MACOS } from '$lib/constants/platform';

export const CommandOrControl = IS_MACOS ? 'Command' : 'Control';

export const CommandOrAlt = IS_MACOS ? 'Command' : 'Alt';
