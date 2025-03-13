import type { KeyCombination } from './index.svelte';

/**
 * Creates a key mapper for local shortcuts (hotkeys-js format)
 */
export function createLocalKeyMapper() {
	// Key mapping for hotkeys-js, from https://github.com/jaywcjlove/hotkeys-js/
	const keyMap: Record<string, string> = {
		// Modifier keys
		Control: 'ctrl',
		Meta: 'command',
		Alt: 'alt',
		Shift: 'shift',

		// Special keys
		' ': 'space',
		ArrowUp: 'up',
		ArrowDown: 'down',
		ArrowLeft: 'left',
		ArrowRight: 'right',
		Escape: 'esc',
		Enter: 'enter',
		Return: 'return',
		Backspace: 'backspace',
		Tab: 'tab',
		Delete: 'delete',
		Home: 'home',
		End: 'end',
		PageUp: 'pageup',
		PageDown: 'pagedown',
		Insert: 'insert',
		CapsLock: 'capslock',
		Clear: 'clear',

		// Function keys
		F1: 'f1',
		F2: 'f2',
		F3: 'f3',
		F4: 'f4',
		F5: 'f5',
		F6: 'f6',
		F7: 'f7',
		F8: 'f8',
		F9: 'f9',
		F10: 'f10',
		F11: 'f11',
		F12: 'f12',
		F13: 'f13',
		F14: 'f14',
		F15: 'f15',
		F16: 'f16',
		F17: 'f17',
		F18: 'f18',
		F19: 'f19',

		// Numpad keys
		Numpad0: 'num_0',
		Numpad1: 'num_1',
		Numpad2: 'num_2',
		Numpad3: 'num_3',
		Numpad4: 'num_4',
		Numpad5: 'num_5',
		Numpad6: 'num_6',
		Numpad7: 'num_7',
		Numpad8: 'num_8',
		Numpad9: 'num_9',
		NumpadMultiply: 'num_multiply',
		NumpadAdd: 'num_add',
		NumpadEnter: 'num_enter',
		NumpadSubtract: 'num_subtract',
		NumpadDecimal: 'num_decimal',
		NumpadDivide: 'num_divide',

		// Additional common keys
		Comma: 'comma',
		Period: '.',
		Semicolon: ';',
		Quote: "'",
		BracketLeft: '[',
		BracketRight: ']',
		Backquote: '`',
		Backslash: '\\',
		Minus: '-',
		Equal: '=',
		Slash: '/',
	};

	return {
		mapKeyboardEvent: (event: KeyboardEvent): KeyCombination | null => {
			const modifiers: string[] = [];
			if (event.ctrlKey) modifiers.push('ctrl');
			if (event.metaKey) modifiers.push('command');
			if (event.altKey) modifiers.push('alt');
			if (event.shiftKey) modifiers.push('shift');

			const getMainKey = ({ key }: KeyboardEvent) => {
				if (key in keyMap) return keyMap[key];
				if (key.length === 1) return key.toLowerCase();
				return key;
			};

			const mainKey = getMainKey(event);

			// Don't allow modifier-only shortcuts
			if (modifiers.includes(mainKey)) return null;

			return [...modifiers, mainKey].join('+');
		},
	};
}

/**
 * Creates a key mapper for global shortcuts (Tauri format)
 */
export function createGlobalKeyMapper() {
	// Key mapping for Tauri Global Shortcut
	// https://v2.tauri.app/plugin/global-shortcut/
	const keyMap: Record<string, string> = {
		// Special keys
		' ': 'Space',
		ArrowUp: 'Up',
		ArrowDown: 'Down',
		ArrowLeft: 'Left',
		ArrowRight: 'Right',
		Escape: 'Escape',
		Enter: 'Return',
		Return: 'Return',
		Backspace: 'Backspace',
		Tab: 'Tab',
		Delete: 'Delete',
		Home: 'Home',
		End: 'End',
		PageUp: 'PageUp',
		PageDown: 'PageDown',
		Insert: 'Insert',
		CapsLock: 'CapsLock',
		Clear: 'Clear',

		// Function keys
		F1: 'F1',
		F2: 'F2',
		F3: 'F3',
		F4: 'F4',
		F5: 'F5',
		F6: 'F6',
		F7: 'F7',
		F8: 'F8',
		F9: 'F9',
		F10: 'F10',
		F11: 'F11',
		F12: 'F12',
		F13: 'F13',
		F14: 'F14',
		F15: 'F15',
		F16: 'F16',
		F17: 'F17',
		F18: 'F18',
		F19: 'F19',

		// Numpad keys
		Numpad0: 'Numpad0',
		Numpad1: 'Numpad1',
		Numpad2: 'Numpad2',
		Numpad3: 'Numpad3',
		Numpad4: 'Numpad4',
		Numpad5: 'Numpad5',
		Numpad6: 'Numpad6',
		Numpad7: 'Numpad7',
		Numpad8: 'Numpad8',
		Numpad9: 'Numpad9',
		NumpadMultiply: 'NumpadMultiply',
		NumpadAdd: 'NumpadAdd',
		NumpadEnter: 'NumpadEnter',
		NumpadSubtract: 'NumpadSubtract',
		NumpadDecimal: 'NumpadDecimal',
		NumpadDivide: 'NumpadDivide',

		// Additional common keys
		Comma: ',',
		Period: '.',
		Semicolon: ';',
		Quote: "'",
		BracketLeft: '[',
		BracketRight: ']',
		Backquote: '`',
		Backslash: '\\',
		Minus: '-',
		Equal: '=',
		Slash: '/',
	};

	return {
		mapKeyboardEvent: (event: KeyboardEvent): KeyCombination | null => {
			const modifiers: string[] = [];

			// Handle Ctrl/Command as CommandOrControl for cross-platform compatibility
			if (event.ctrlKey || event.metaKey) {
				modifiers.push('CommandOrControl');
			}

			if (event.altKey) modifiers.push('Alt');
			if (event.shiftKey) modifiers.push('Shift');

			const getMainKey = ({ key }: KeyboardEvent) => {
				if (key in keyMap) return keyMap[key];
				if (key.length === 1) return key.toUpperCase();
				return key;
			};

			const mainKey = getMainKey(event);

			// Don't allow modifier-only shortcuts
			if (isModifierKey(mainKey)) return null;

			return [...modifiers, mainKey].join('+');
		},
	};
}

function isModifierKey(key: string): boolean {
	return [
		'CommandOrControl',
		'Control',
		'Meta',
		'Command',
		'Alt',
		'Shift',
		'ctrl',
		'command',
		'alt',
		'shift',
	].includes(key);
}
