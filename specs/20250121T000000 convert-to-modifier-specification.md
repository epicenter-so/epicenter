# Convert to Modifier Function Specification

## Overview

The `convertToModifier` function needs to map browser KeyboardEvent.key values to Electron Accelerator modifiers, accounting for platform-specific differences in how modifier keys are represented.

## Problem Statement

Browser KeyboardEvent.key values don't directly map to Electron Accelerator modifiers due to:
1. Platform differences in key naming (e.g., Option vs Alt)
2. Browser normalization of platform-specific keys (e.g., Command → Meta)
3. Electron's cross-platform abstractions (e.g., CommandOrControl)

## Platform-Specific Key Mappings

### Browser KeyboardEvent.key Values

When a modifier key is pressed, the browser reports these values:

| Physical Key | Windows | Linux | macOS |
|--------------|---------|--------|--------|
| Ctrl/Control | "Control" | "Control" | "Control" |
| Alt/Option | "Alt" | "Alt" | "Alt" |
| Shift | "Shift" | "Shift" | "Shift" |
| Windows/Command | "Meta" | "Meta" | "Meta" |
| AltGr | "AltGraph" | "AltGraph" | N/A |

### Electron Accelerator Modifiers

Electron expects these modifier strings in accelerators:

| Modifier | Windows | Linux | macOS |
|----------|---------|--------|--------|
| Control Key | "Control" or "Ctrl" | "Control" or "Ctrl" | "Control" or "Ctrl" |
| Alt/Option Key | "Alt" | "Alt" | "Alt" or "Option" |
| Shift Key | "Shift" | "Shift" | "Shift" |
| OS Key | "Super" | "Super" | "Command" or "Cmd" |
| AltGr | "AltGr" | "AltGr" | N/A |

### Cross-Platform Abstractions

Electron provides these cross-platform modifiers:
- `CommandOrControl` (or `CmdOrCtrl`) - Maps to Command on macOS, Control on Windows/Linux
- `Super` - Maps to Windows key on Windows/Linux, Command on macOS

## Transformation Rules

### Windows Platform
- `"control"` → `"Control"`
- `"alt"` → `"Alt"`
- `"shift"` → `"Shift"`
- `"meta"` → `"Super"`
- `"altgraph"` → `"AltGr"`

### Linux Platform
- `"control"` → `"Control"`
- `"alt"` → `"Alt"`
- `"shift"` → `"Shift"`
- `"meta"` → `"Super"`
- `"altgraph"` → `"AltGr"`

### macOS Platform
- `"control"` → `"Control"`
- `"alt"` → `"Option"` (important: macOS uses Option, not Alt)
- `"shift"` → `"Shift"`
- `"meta"` → `"Command"` (important: browser reports Meta, but Electron uses Command)
- `"altgraph"` → Not supported on macOS

## Edge Cases and Considerations

### 1. Modifier Key Detection
Some keys like "Fn", "Hyper", "Symbol", "SymbolLock" may be reported by browsers but aren't standard Electron modifiers.

### 2. Case Sensitivity
- Browser keys are case-sensitive when reported
- Electron accelerators are case-insensitive but conventionally use PascalCase
- Function should handle lowercase input (as specified)

### 3. Platform Detection
The function needs access to platform information via a `getPlatform()` function that returns:
- `"Windows"`
- `"Linux"`
- `"macOS"`

### 4. Cross-Platform Compatibility
For maximum compatibility, consider:
- Using `CommandOrControl` instead of platform-specific modifiers when appropriate
- `Alt` works on all platforms, but `Option` is macOS-specific
- `Super` is a cross-platform way to refer to the OS key

## Function Signature

```typescript
type Platform = "Windows" | "Linux" | "macOS";
type BrowserModifierKey = "control" | "alt" | "shift" | "meta" | "altgraph";
type ElectronModifier = "Control" | "Alt" | "Shift" | "Command" | "Option" | "Super" | "AltGr";

function getPlatform(): Platform; // Assumed to be provided

function convertToModifier(key: string): ElectronModifier | null;
```

## Implementation Requirements

1. Accept lowercase browser key values
2. Return appropriate Electron modifier based on current platform
3. Return `null` for non-modifier keys or unsupported modifiers
4. Handle all standard modifier keys across all platforms
5. Map platform-specific keys correctly (e.g., meta → Command on macOS, meta → Super on Windows/Linux)

## Test Cases

### Windows/Linux
- `convertToModifier("control")` → `"Control"`
- `convertToModifier("alt")` → `"Alt"`
- `convertToModifier("shift")` → `"Shift"`
- `convertToModifier("meta")` → `"Super"`
- `convertToModifier("altgraph")` → `"AltGr"`

### macOS
- `convertToModifier("control")` → `"Control"`
- `convertToModifier("alt")` → `"Option"`
- `convertToModifier("shift")` → `"Shift"`
- `convertToModifier("meta")` → `"Command"`
- `convertToModifier("altgraph")` → `null`

### All Platforms
- `convertToModifier("fn")` → `null`
- `convertToModifier("hyper")` → `null`
- `convertToModifier("symbollock")` → `null`
- `convertToModifier("randomkey")` → `null`

## Review

### Changes Made

1. **Added comprehensive JSDoc documentation** to the `convertToModifier` function explaining:
   - The purpose of the function
   - Platform-specific behavior details
   - Examples for each platform
   - Parameter and return type descriptions

2. **Implemented platform detection** using Tauri's `@tauri-apps/plugin-os`:
   - Imported the `os` module from the plugin
   - Used `os.type()` to get the current platform
   - Properly handled the lowercase platform values ('macos', 'windows', 'linux')

3. **Fixed platform-specific key mappings**:
   - macOS: `alt` → `Option`, `meta` → `Command`
   - Windows/Linux: `alt` → `Alt`, `meta` → `Super`
   - Handled `altgraph` → `AltGr` (not available on macOS)

4. **Maintained support for edge cases**:
   - Keys like "super", "hyper", "fn", "symbollock" that may be reported by browsers
   - Proper null returns for non-modifier keys

### Summary

The `convertToModifier` function now correctly handles the platform-specific differences between how browsers report modifier keys and how Electron expects them in accelerators. The implementation uses Tauri's native platform detection for accuracy and includes extensive documentation to help future developers understand the complex mappings involved.