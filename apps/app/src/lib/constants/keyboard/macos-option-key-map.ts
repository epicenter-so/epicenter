import type { KeyboardEventPossibleKey } from './browser/possible-keys';

/**
 * Maps macOS Option+Key special characters to their base keyboard keys.
 * When Option (Alt) is held on macOS, pressing keys produces special characters
 * instead of the normal key events. This mapping allows us to normalize these
 * back to their original keys for consistent shortcut handling.
 */
const OPTION_KEY_CHARACTER_MAP: Record<string, KeyboardEventPossibleKey> = {
	// Option + Letters (A-Z)
	å: 'a', // Option+A
	'∫': 'b', // Option+B
	ç: 'c', // Option+C
	'∂': 'd', // Option+D
	ƒ: 'f', // Option+F (E is accent modifier)
	'©': 'g', // Option+G
	'˙': 'h', // Option+H
	'∆': 'j', // Option+J (I is accent modifier)
	'˚': 'k', // Option+K
	'¬': 'l', // Option+L
	µ: 'm', // Option+M
	ø: 'o', // Option+O (N is accent modifier)
	π: 'p', // Option+P
	œ: 'q', // Option+Q
	'®': 'r', // Option+R
	ß: 's', // Option+S
	'†': 't', // Option+T
	'√': 'v', // Option+V (U is accent modifier)
	'∑': 'w', // Option+W
	'≈': 'x', // Option+X
	'¥': 'y', // Option+Y
	Ω: 'z', // Option+Z

	// Option + Numbers
	º: '0', // Option+0
	'¡': '1', // Option+1
	'™': '2', // Option+2
	'£': '3', // Option+3
	'¢': '4', // Option+4
	'•': '8', // Option+8 (5,6,7 don't produce special chars)
	ª: '9', // Option+9

	// Option + Punctuation
	'"': '[', // Option+[
	"'": ']', // Option+]
	'–': '-', // Option+- (en dash)
	'÷': '/', // Option+/
	'≥': '.', // Option+.
	'≤': ',', // Option+,
};

/**
 * Normalizes macOS Option+Key special characters back to their base keys.
 *
 * When the Option (Alt) key is held on macOS, typing another key produces
 * special characters (e.g., Option+A = "å"). This function maps these special
 * characters back to their original keys so keyboard shortcuts work correctly.
 *
 * @param key - The key from the keyboard event (already lowercased)
 * @returns The normalized key ('å' → 'a') or the original if not a special character
 *
 * @example
 * normalizeOptionKeyCharacter('å') // returns 'a'
 * normalizeOptionKeyCharacter('a') // returns 'a' (unchanged)
 * normalizeOptionKeyCharacter('alt') // returns 'alt' (multi-char unchanged)
 */
export function normalizeOptionKeyCharacter(
	key: KeyboardEventPossibleKey,
): KeyboardEventPossibleKey {
	// Only process single characters (multi-char keys like 'alt', 'enter' pass through)
	if (key.length !== 1) return key;

	// Return the normalized key or the original if not found
	return OPTION_KEY_CHARACTER_MAP[key] ?? key;
}

/**
 * Set of keys that act as "dead keys" with Option on macOS.
 * These don't produce a character immediately but wait for the next key
 * to create accented characters (e.g., Option+E then A = "á").
 */
export const OPTION_DEAD_KEYS = new Set(['e', 'i', 'n', 'u', '`']);
