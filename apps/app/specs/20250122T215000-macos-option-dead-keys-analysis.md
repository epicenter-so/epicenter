# macOS Option Dead Keys - Analysis and Solutions

## The Dead Key Problem

Dead keys are a special case where pressing Option+Key doesn't immediately produce a character. Instead, macOS enters a "composition" state, waiting for the next key to create an accented character.

### macOS Dead Keys:

- **Option+E**: Waits to create acute accents (é, á, ó)
- **Option+I**: Waits to create circumflex accents (î, ô, û)
- **Option+N**: Waits to create tildes (ñ, ã, õ)
- **Option+U**: Waits to create umlauts (ü, ö, ä)
- **Option+`**: Waits to create grave accents (è, à, ù)

### The Problem for Keyboard Shortcuts:

```javascript
// Current behavior:
// 1. User presses Option (Alt): pressedKeys = ['alt']
// 2. User presses E: Nothing happens! No keydown event with a character
// 3. Browser enters composition mode, waiting for next key
// 4. User releases E and Option: No "alt+e" was ever registered

// What we want:
// Option+E should register as ['alt', 'e'] for shortcuts
```

## Potential Solutions

### Solution 1: Detect and Register Dead Keys Immediately

```typescript
const OPTION_DEAD_KEYS = new Set(['e', 'i', 'n', 'u', '`']);

// In keydown handler:
if (isOptionPressed && e.key === 'Dead') {
	// Some browsers report 'Dead' for dead keys
	// We need to figure out which dead key from e.code
	const code = e.code.toLowerCase();
	if (code === 'keye') key = 'e';
	else if (code === 'keyi') key = 'i';
	// ... etc
}
```

### Solution 2: Use Composition Events

```typescript
let compositionKey: string | null = null;

window.addEventListener('compositionstart', (e) => {
	if (pressedKeys.includes('alt')) {
		// A dead key was pressed with Option
		// Try to extract the key from the event
		compositionKey = extractKeyFromComposition(e);
	}
});

window.addEventListener('compositionend', (e) => {
	compositionKey = null;
});
```

### Solution 3: PreventDefault on Known Dead Keys (Recommended)

```typescript
const OPTION_DEAD_KEYS = new Set(['e', 'i', 'n', 'u', '`']);

const keydown = on(window, 'keydown', (e) => {
	let key = e.key.toLowerCase() as KeyboardEventPossibleKey;

	// Handle Option dead keys BEFORE they become dead
	const isMacos = services.os.type() === 'macos';
	const isOptionPressed = isMacos && pressedKeys.includes('alt');

	if (isOptionPressed && OPTION_DEAD_KEYS.has(key)) {
		// Force preventDefault to stop composition mode
		e.preventDefault();
		// The key will register normally now
	} else if (preventDefault) {
		e.preventDefault();
	}

	// Rest of the logic...
});
```

### Solution 4: Check Multiple Key Properties

```typescript
if (isOptionPressed) {
	// Try multiple sources to get the actual key
	let actualKey = e.key.toLowerCase();

	// If we get 'Dead' or nothing useful, try other properties
	if (!actualKey || actualKey === 'dead' || actualKey === 'unidentified') {
		// Extract from code (e.g., 'KeyE' -> 'e')
		const codeMatch = e.code.match(/^Key([A-Z])$/i);
		if (codeMatch) {
			actualKey = codeMatch[1].toLowerCase();
		}
	}

	key = actualKey;
}
```

## Recommended Implementation

The cleanest approach combines prevention and detection:

```typescript
// In constants file
export const OPTION_DEAD_KEYS = new Set(['e', 'i', 'n', 'u', '`']);

// In createPressedKeys
const keydown = on(window, 'keydown', (e) => {
	let key = e.key.toLowerCase() as KeyboardEventPossibleKey;
	const isMacos = services.os.type() === 'macos';
	const isOptionPressed = isMacos && pressedKeys.includes('alt');

	// Special handling for Option dead keys on macOS
	if (isOptionPressed) {
		// Always preventDefault when Option is held to prevent dead key composition
		e.preventDefault();

		// If the key appears to be dead, extract from e.code
		if (key === 'dead' || key === 'unidentified' || key === '') {
			const codeMatch = e.code.match(/^Key([A-Z])$/i);
			if (codeMatch) {
				key = codeMatch[1].toLowerCase() as KeyboardEventPossibleKey;
			}
		} else {
			// Normal Option+Key combinations, normalize special characters
			key = normalizeOptionKeyCharacter(key) as KeyboardEventPossibleKey;
		}
	} else if (preventDefault) {
		e.preventDefault();
	}

	// Continue with normal key handling...
});
```

## Testing Dead Keys

To test if the solution works:

1. Press Option+E (should register as ['alt', 'e'])
2. Press Option+E then A (should register as ['alt', 'e'] then ['a'], not 'á')
3. Press Option+N (should register as ['alt', 'n'])
4. Ensure normal typing still works when not recording shortcuts

## Edge Cases

1. **International Keyboards**: Different layouts have different dead keys
2. **IME (Input Method Editor)**: Asian language inputs might conflict
3. **Accessibility Software**: Screen readers might intercept these keys
4. **Browser Differences**: Safari, Chrome, and Firefox handle dead keys slightly differently

## Conclusion

The best approach is to:

1. Always preventDefault when Option is held during shortcut recording
2. Check multiple properties (e.key, e.code) to extract the actual key
3. Test thoroughly on real macOS devices with different browsers

This ensures Option+E registers as a shortcut instead of starting accent composition.
