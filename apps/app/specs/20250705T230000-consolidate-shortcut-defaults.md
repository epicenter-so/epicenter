# Consolidate Shortcut Defaults into Settings

## Problem

Currently, default shortcuts are defined in two places:

1. `commands.ts` - Each command has `defaultLocalShortcut` and `defaultGlobalShortcut` properties
2. `settings.ts` - Shortcut settings exist but all default to `null`

This creates a dual source of truth and makes the code harder to maintain.

## Solution

Move all default shortcut values from `commands.ts` into the `settings.ts` schema, making settings the single source of truth.

## Current Default Shortcuts (from commands.ts)

- `pushToTalk`: local='p', global='${CommandOrAlt}+Shift+D'
- `toggleManualRecording`: local=' ', global='${CommandOrControl}+Shift+;'
- `cancelManualRecording`: local='c', global='${CommandOrControl}+Shift+\''
- `toggleVadRecording`: local='v', global=null
- `toggleCpalRecording`: local=null, global=null
- `cancelCpalRecording`: local=null, global=null

## Todo Items

### Phase 1: Update settings schema

- [ ] Update `settings.ts` to include actual default shortcut values instead of null
- [ ] Import keyboard constants into settings.ts for default global shortcuts

### Phase 2: Remove defaults from commands

- [ ] Remove `defaultLocalShortcut` and `defaultGlobalShortcut` from `SatisfiedCommand` type
- [ ] Remove these properties from all command definitions in the commands array

### Phase 3: Update consumers

- [ ] Search for any code that uses `command.defaultLocalShortcut` or `command.defaultGlobalShortcut`
- [ ] Update those consumers to use the settings instead
- [ ] Test that shortcuts still work correctly

### Phase 4: Verification

- [ ] Run the application and verify all shortcuts work with their expected defaults
- [ ] Test that custom shortcuts still override defaults correctly
- [ ] Ensure no TypeScript errors

## Benefits

- Single source of truth for all shortcut defaults
- Cleaner command definitions focused on behavior, not configuration
- Easier to modify default shortcuts in the future
- Consistent with the settings system design philosophy
