# Improve pressedKeysToTauriAccelerator Function

## Overview
The `pressedKeysToTauriAccelerator` function needs improvements to properly convert `SupportedKey` values to Electron-compatible accelerator strings, following the Electron accelerator specification and returning proper error handling with Result types.

## Current Issues
1. Missing implementation for `convertToModifier` and `convertToKeyCode` functions
2. Function throws errors instead of returning `Result<Accelerator, InvalidAcceleratorError>`
3. Need to handle platform-specific modifier mappings (CommandOrControl, Alt vs Option, etc.)
4. Need to ensure proper key name transformations (e.g., lowercase to proper case)

## Electron Accelerator Rules to Follow
1. **Platform-specific modifiers:**
   - Use `CommandOrControl` instead of separate Command/Control
   - Use `Alt` instead of `Option` (Option is macOS-only)
   - `Super`/`Meta` maps to Windows key on Windows/Linux, Cmd on macOS

2. **Case sensitivity:**
   - Accelerators are case-insensitive
   - But convention is to use proper case (e.g., "Ctrl+A" not "ctrl+a")

3. **Format:**
   - Modifiers and key code combined with `+` character
   - Only one key code allowed per accelerator
   - Modifiers should come before the key code

## Implementation Plan

### Todo List
- [ ] Implement `convertToModifier` function with proper platform mappings
- [ ] Implement `convertToKeyCode` function with key name transformations
- [ ] Update `pressedKeysToTauriAccelerator` to return Result type
- [ ] Add proper modifier ordering (standard order: Ctrl, Alt, Shift, Meta/Cmd)
- [ ] Add comprehensive mapping for special keys (arrow keys, function keys, etc.)
- [ ] Update tests if they exist

### Detailed Changes

#### 1. convertToModifier Implementation
Map SupportedKey modifier values to Electron accelerator modifiers:
- `control` → `CommandOrControl` (cross-platform)
- `meta` → `CommandOrControl` (for consistency)
- `alt` → `Alt`
- `shift` → `Shift`
- `altgraph` → `AltGr`
- Other modifiers like `super`, `hyper`, `fn` → return null (not standard accelerator modifiers)

#### 2. convertToKeyCode Implementation
Transform SupportedKey values to proper Electron key codes:
- Single letters: `'a'` → `'A'` (uppercase)
- Numbers: `'0'` → `'0'` (unchanged)
- Arrow keys: `'arrowup'` → `'Up'`, `'arrowdown'` → `'Down'`, etc.
- Function keys: `'f1'` → `'F1'` (uppercase)
- Special keys mapping:
  - `' '` (space) → `'Space'`
  - `'enter'` → `'Enter'`
  - `'tab'` → `'Tab'`
  - `'escape'` → `'Escape'`
  - `'backspace'` → `'Backspace'`
  - `'delete'` → `'Delete'`
  - `'insert'` → `'Insert'`
  - `'home'` → `'Home'`
  - `'end'` → `'End'`
  - `'pageup'` → `'PageUp'`
  - `'pagedown'` → `'PageDown'`
  - Media keys: `'volumeup'` → `'VolumeUp'`, etc.
  - `'printscreen'` → `'PrintScreen'`

#### 3. Update pressedKeysToTauriAccelerator
Change error handling from throwing to returning Result:
```typescript
// Instead of:
throw new Error('No valid key code found in pressed keys');

// Use:
return Err({
  name: 'InvalidAcceleratorError',
  message: 'No valid key code found in pressed keys',
  context: { pressedKeys },
  cause: new Error('No valid key code found'),
});
```

#### 4. Modifier Ordering
Ensure modifiers appear in a consistent order in the final accelerator string:
1. CommandOrControl / Ctrl
2. Alt
3. Shift
4. Meta (if separate from CommandOrControl)

This ensures consistent accelerator strings regardless of the order keys were pressed.

## Benefits
1. **Better error handling:** No uncaught exceptions, proper Result type usage
2. **Cross-platform compatibility:** Proper use of CommandOrControl and Alt
3. **Electron spec compliance:** Following all documented rules
4. **Type safety:** Leveraging TypeScript's type system with Result types
5. **Consistent output:** Standardized modifier ordering and key naming

## Example Transformations
- `['control', 'shift', 'a']` → `Ok('CommandOrControl+Shift+A')`
- `['meta', 'alt', 'f1']` → `Ok('CommandOrControl+Alt+F1')`
- `['alt', 'arrowup']` → `Ok('Alt+Up')`
- `[' ']` → `Ok('Space')`
- `['control', 'shift']` → `Err(InvalidAcceleratorError)` (no key code)
- `['a', 'b']` → `Err(InvalidAcceleratorError)` (multiple key codes)