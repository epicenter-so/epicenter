export type { AcceleratorPossibleKey } from './accelerator/possible-keys';

export {
	ACCELERATOR_SECTIONS,
	ACCELERATOR_MODIFIER_KEYS,
	ACCELERATOR_KEY_CODES,
	type AcceleratorModifier,
	type AcceleratorKeyCode,
} from './accelerator/supported-keys';

export type { KeyboardEventPossibleKey } from './browser/possible-keys';

export {
	KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS,
	KEYBOARD_EVENT_SUPPORTED_KEYS,
	isSupportedKey,
	type KeyboardEventSupportedKey,
} from './browser/supported-keys';

export {
	normalizeOptionKeyCharacter,
	OPTION_DEAD_KEYS,
} from './macos-option-key-map';

export { CommandOrControl, CommandOrAlt } from './modifiers';
