import { IS_MACOS } from './is-macos';

export const CommandOrControl = IS_MACOS ? 'Command' : 'Control';

export const CommandOrAlt = IS_MACOS ? 'Command' : 'Alt';
