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

/**
 * Convert a shortcut string to Tauri's Accelerator format
 * @example "ctrl+shift+a" → "Control+Shift+A"
 */
export function shortcutStringToTauriAccelerator(shortcut: string): string {
	const keys = shortcut.split('+');
	return keys
		.map((key) => {
			const normalized = key.toLowerCase();
			switch (normalized) {
				case 'ctrl':
				case 'control':
					return 'Control';
				case 'cmd':
				case 'command':
				case 'meta':
					return 'CommandOrControl';
				case 'alt':
				case 'option':
					return 'Alt';
				case 'shift':
					return 'Shift';
				case 'space':
					return 'Space';
				case 'enter':
				case 'return':
					return 'Return';
				case 'esc':
				case 'escape':
					return 'Escape';
				case 'tab':
					return 'Tab';
				case 'backspace':
					return 'Backspace';
				case 'delete':
					return 'Delete';
				case 'up':
				case 'arrowup':
					return 'Up';
				case 'down':
				case 'arrowdown':
					return 'Down';
				case 'left':
				case 'arrowleft':
					return 'Left';
				case 'right':
				case 'arrowright':
					return 'Right';
				default:
					// For letters and numbers, capitalize
					return normalized.charAt(0).toUpperCase() + normalized.slice(1);
			}
		})
		.join('+');
}

/**
 * Normalize a key name to a consistent format
 * This helps handle variations like "Control" vs "ctrl"
 */
export function normalizeKey(key: string): string {
	const normalized = key.toLowerCase();

	// Map common variations to a standard format
	switch (normalized) {
		case 'control':
		case 'ctrl':
			return 'ctrl';
		case 'command':
		case 'cmd':
		case 'meta':
			return 'cmd';
		case 'option':
		case 'alt':
			return 'alt';
		case 'return':
		case 'enter':
			return 'enter';
		case 'escape':
		case 'esc':
			return 'esc';
		case 'arrowup':
			return 'up';
		case 'arrowdown':
			return 'down';
		case 'arrowleft':
			return 'left';
		case 'arrowright':
			return 'right';
		default:
			return normalized;
	}
}

/**
 * Format an array of keys for display in the UI
 * @example ["ctrl", "shift", "a"] → "Ctrl+Shift+A"
 */
export function formatKeysForDisplay(keys: string[]): string {
	return keys
		.map((key) => {
			const normalized = normalizeKey(key);
			switch (normalized) {
				case 'ctrl':
					return 'Ctrl';
				case 'cmd':
					return 'Cmd';
				case 'alt':
					return 'Alt';
				case 'shift':
					return 'Shift';
				case 'space':
					return 'Space';
				case 'enter':
					return 'Enter';
				case 'esc':
					return 'Esc';
				case 'tab':
					return 'Tab';
				case 'backspace':
					return 'Backspace';
				case 'delete':
					return 'Delete';
				case 'up':
					return '↑';
				case 'down':
					return '↓';
				case 'left':
					return '←';
				case 'right':
					return '→';
				default:
					// Capitalize first letter
					return normalized.charAt(0).toUpperCase() + normalized.slice(1);
			}
		})
		.join('+');
}
