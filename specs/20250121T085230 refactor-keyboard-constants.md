# Refactor Keyboard Shortcut Constants

## Goal
Refactor keyboard shortcut constants to consolidate them in keyboard.ts with better organization and structure.

## Current State
- `LOCAL_SHORTCUTS` and `GLOBAL_SHORTCUTS` in keyboard.ts have sections but aren't structured optimally
- `SUPPORTED_KEY_VALUES` in createLocalShortcutManager.ts is a flat array
- `ACCELERATOR_KEY_CODES` and `ACCELERATOR_MODIFIERS` in createGlobalShortcutManager.ts are flat arrays

## Plan

### 1. Create structured objects for local shortcuts
- [ ] Convert `SUPPORTED_KEY_VALUES` to an object with sections (MODIFIERS, LETTERS, NUMBERS, etc.)
- [ ] Each section has title, description, and keys array
- [ ] Create flattened `SUPPORTED_KEY_VALUES` array for compatibility

### 2. Create structured objects for global shortcuts (accelerators)
- [ ] Create `ACCELERATOR` object with nested `KEY_CODES` and `MODIFIERS` sections
- [ ] Each section follows same structure (title, description, keys)
- [ ] Create flattened arrays for compatibility

### 3. Update imports and usage
- [ ] Move constants from shortcut managers to keyboard.ts
- [ ] Update imports in createLocalShortcutManager.ts
- [ ] Update imports in createGlobalShortcutManager.ts
- [ ] Ensure types still work correctly

### 4. Remove deprecated constants
- [ ] Remove `LOCAL_SHORTCUTS` and `GLOBAL_SHORTCUTS` from keyboard.ts
- [ ] Update any code that references these old constants

## Structure Example
```typescript
export const LOCAL_SHORTCUT_KEYS = {
  MODIFIERS: {
    title: 'Modifiers',
    description: 'Hold with other keys',
    keys: ['control', 'shift', 'alt', 'meta', ...] as const
  },
  LETTERS: {
    title: 'Letters',
    description: 'Any letter A-Z',
    keys: ['a', 'b', 'c', ...] as const
  },
  // ... more sections
} as const;

// For compatibility
export const SUPPORTED_KEY_VALUES = Object.values(LOCAL_SHORTCUT_KEYS)
  .flatMap(section => section.keys);
```