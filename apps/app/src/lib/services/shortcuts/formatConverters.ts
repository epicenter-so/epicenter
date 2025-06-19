/**
 * Convert a shortcut string to an array of keys
 * @example "ctrl+shift+a" → ["ctrl", "shift", "a"]
 */
export function shortcutStringToArray(shortcut: string): string[] {
	return shortcut.split('+').map((key) => key.toLowerCase());
}

/**
 * Join an array of keys into a shortcut string
 * @example ["ctrl", "shift", "a"] → "ctrl+shift+a"
 */
export function arrayToShortcutString(keys: string[]): string {
	return keys.map((key) => key.toLowerCase()).join('+');
}
