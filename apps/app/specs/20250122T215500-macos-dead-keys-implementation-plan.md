# macOS Option Dead Keys - Implementation Plan

## Overview

Fix Option dead keys (E, I, N, U, `) so they register as normal keys when recording shortcuts.

## Todo List

- [ ] Add OPTION_DEAD_KEYS constant to macos-option-key-map.ts
- [ ] Update keydown handler to preventDefault when Option is held
- [ ] Add dead key detection when e.key is 'Dead' or empty
- [ ] Extract key from e.code when needed
- [ ] Test all Option dead key combinations
- [ ] Ensure normal typing works when not recording

## Implementation

### 1. Update macos-option-key-map.ts

```typescript
// Add to src/lib/constants/macos-option-key-map.ts

/**
 * Set of keys that act as "dead keys" with Option on macOS.
 * These don't produce a character immediately but wait for the next key
 * to create accented characters (e.g., Option+E then A = "á").
 */
export const OPTION_DEAD_KEYS = new Set(['e', 'i', 'n', 'u', '`']);

/**
 * Extracts the base key from a keyboard event code.
 * Used when dead keys report no useful key value.
 *
 * @example
 * extractKeyFromCode('KeyE') // returns 'e'
 * extractKeyFromCode('Digit1') // returns '1'
 * extractKeyFromCode('BracketLeft') // returns null
 */
export function extractKeyFromCode(code: string): string | null {
	// Handle letter keys: KeyA -> a
	const letterMatch = code.match(/^Key([A-Z])$/i);
	if (letterMatch) {
		return letterMatch[1].toLowerCase();
	}

	// Handle digit keys: Digit1 -> 1
	const digitMatch = code.match(/^Digit(\d)$/);
	if (digitMatch) {
		return digitMatch[1];
	}

	// Handle Backquote for Option+`
	if (code === 'Backquote') {
		return '`';
	}

	return null;
}
```

### 2. Update createPressedKeys.svelte.ts

```typescript
import {
	normalizeOptionKeyCharacter,
	extractKeyFromCode,
} from '$lib/constants/macos-option-key-map';

// In the keydown handler, replace the current Option handling with:

const keydown = on(window, 'keydown', (e) => {
	const isMacos = services.os.type() === 'macos';
	const isOptionPressed = isMacos && pressedKeys.includes('alt');

	// Force preventDefault when Option is held on macOS
	// This prevents dead key composition mode
	if (isOptionPressed || preventDefault) {
		e.preventDefault();
	}

	let key = e.key.toLowerCase() as KeyboardEventPossibleKey;

	// macOS Option key handling:
	// 1. Dead keys (E, I, N, U, `) need special handling
	// 2. Regular Option combinations need character normalization
	if (isOptionPressed) {
		// Check if this is a dead key situation
		if (!key || key === 'dead' || key === 'unidentified' || key === 'process') {
			// Dead key detected, extract from e.code
			const extractedKey = extractKeyFromCode(e.code);
			if (extractedKey) {
				key = extractedKey as KeyboardEventPossibleKey;
			}
		} else if (key.length === 1) {
			// Normal Option+Key combination, normalize special characters
			key = normalizeOptionKeyCharacter(key) as KeyboardEventPossibleKey;
		}
	}

	if (!isSupportedKey(key)) {
		onUnsupportedKey?.(key);
		return;
	}

	if (!pressedKeys.includes(key)) {
		pressedKeys.push(key);
	}
	update();
});
```

### 3. Update the keyup handler similarly

```typescript
const keyup = on(window, 'keyup', (e) => {
	let key = e.key.toLowerCase() as KeyboardEventPossibleKey;

	const isMacos = services.os.type() === 'macos';
	const isOptionPressed = isMacos && pressedKeys.includes('alt');

	// Apply same key extraction logic for consistency
	if (isOptionPressed) {
		if (!key || key === 'dead' || key === 'unidentified' || key === 'process') {
			const extractedKey = extractKeyFromCode(e.code);
			if (extractedKey) {
				key = extractedKey as KeyboardEventPossibleKey;
			}
		} else if (key.length === 1) {
			key = normalizeOptionKeyCharacter(key) as KeyboardEventPossibleKey;
		}
	}

	if (!isSupportedKey(key)) return;

	// Rest of keyup logic...
});
```

## Benefits

1. **Option+E works**: Registers as ['alt', 'e'] instead of entering composition mode
2. **Consistent behavior**: All Option combinations work the same way
3. **No browser hacks**: Uses standard preventDefault approach
4. **Cross-browser**: Works in Safari, Chrome, and Firefox

## Testing Checklist

- [ ] Option+E registers as ['alt', 'e']
- [ ] Option+I registers as ['alt', 'i']
- [ ] Option+N registers as ['alt', 'n']
- [ ] Option+U registers as ['alt', 'u']
- [ ] Option+` registers as ['alt', '`']
- [ ] Normal typing works when preventDefault is false
- [ ] Test in Safari, Chrome, and Firefox on macOS

## Potential Issues

1. **Always preventing default with Option**: This means users can't type accented characters while recording shortcuts. This is probably fine since they're recording shortcuts, not typing text.

2. **Browser differences**: Some browsers might report different values for dead keys ('Dead' vs 'Process' vs empty string).

3. **Non-US keyboards**: Other keyboard layouts might have different dead keys with Option.

## Summary

This solution elegantly handles both dead keys and special characters by:

1. Always preventing default when Option is held (stops composition mode)
2. Detecting dead keys by checking for empty/special key values
3. Extracting the actual key from e.code when needed
4. Normalizing special characters as before

The result is that Option+Any Key works consistently for keyboard shortcuts!
