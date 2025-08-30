import type { KeyboardEventPossibleKey } from './browser/possible-keys';

/**
 * Maps macOS Option+Key special characters to their base keyboard keys.
 * When Option (Alt) is held on macOS, pressing keys produces special characters
 * instead of the normal key events. This mapping allows us to normalize these
 * back to their original keys for consistent shortcut handling.
 */
const OPTION_KEY_CHARACTER_MAP: Record<string, KeyboardEventPossibleKey> = {
	'–': '-', // Option+- (en dash)
	'¡': '1', // Option+1
	// Option + Punctuation
	'"': '[', // Option+[
	"'": ']', // Option+]
	'†': 't', // Option+T
	'•': '8', // Option+8 (5,6,7 don't produce special chars)
	'˙': 'h', // Option+H
	'˚': 'k', // Option+K
	'©': 'g', // Option+G
	'®': 'r', // Option+R
	'∂': 'd', // Option+D
	'∆': 'j', // Option+J (I is accent modifier)
	'∑': 'w', // Option+W
	'÷': '/', // Option+/
	'¬': 'l', // Option+L
	'√': 'v', // Option+V (U is accent modifier)
	'∫': 'b', // Option+B
	'≈': 'x', // Option+X
	'≤': ',', // Option+,
	'≥': '.', // Option+.
	'¢': '4', // Option+4
	'£': '3', // Option+3

	'¥': 'y', // Option+Y
	ª: '9', // Option+9
	// Option + Letters (A-Z)
	å: 'a', // Option+A
	ç: 'c', // Option+C
	ƒ: 'f', // Option+F (E is accent modifier)
	// Option + Numbers
	º: '0', // Option+0
	ø: 'o', // Option+O (N is accent modifier)

	œ: 'q', // Option+Q
	ß: 's', // Option+S
	'™': '2', // Option+2
	µ: 'm', // Option+M
	π: 'p', // Option+P
	Ω: 'z', // Option+Z
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
export const OPTION_DEAD_KEYS = new Set(['`', 'e', 'i', 'n', 'u']);
