# Split Manual and CPAL Recording Modes

## Overview

This spec outlines the refactoring of the current recording mode system to split the "manual" mode into two separate modes: "manual" (for navigator/browser API) and "cpal" (for native CPAL recording). This will result in four total recording modes: manual, cpal, vad, and live.

## Current State

### Recording Modes
- **Manual**: Supports both `navigator` (browser API) and `tauri` (native) methods
- **VAD (Voice Activated)**: Only supports `navigator` method
- **Live**: Not implemented, only supports `navigator` method

### Settings Structure
```typescript
'recording.mode': 'manual' | 'vad' | 'live'
'recording.manual.method': 'navigator' | 'tauri'
'recording.manual.navigator.selectedDeviceId': string | null
'recording.manual.navigator.bitrateKbps': string
'recording.manual.tauri.selectedDeviceId': string | null
'recording.vad.method': 'navigator'  // Only navigator supported
'recording.vad.navigator.selectedDeviceId': string | null
'recording.vad.navigator.bitrateKbps': string
'recording.live.method': 'navigator'  // Only navigator supported
'recording.live.navigator.selectedDeviceId': string | null
'recording.live.navigator.bitrateKbps': string
```

## Proposed Changes

### New Recording Modes
- **Manual**: Browser API recording only (navigator)
- **CPAL**: Native CPAL recording only
- **VAD**: Voice activated recording (navigator only)
- **Live**: Live transcription (not implemented)

### New Settings Structure
```typescript
'recording.mode': 'manual' | 'cpal' | 'vad' | 'live'
// Remove all .method sub-properties
'recording.manual.selectedDeviceId': string | null
'recording.manual.bitrateKbps': string
'recording.cpal.selectedDeviceId': string | null
'recording.vad.selectedDeviceId': string | null
'recording.vad.bitrateKbps': string
'recording.live.selectedDeviceId': string | null
'recording.live.bitrateKbps': string
```

## Todo List

### 1. Update Constants and Types
- [ ] Update `RECORDING_MODES` constant to include 'cpal'
- [ ] Update `RECORDING_MODE_OPTIONS` to add CPAL option with appropriate icon
- [ ] Remove `MANUAL_RECORDING_METHODS` constant and related types
- [ ] Update `RecordingMode` type

### 2. Update Settings Schema (settingsV6.ts → settingsV7.ts)
- [ ] Create new settingsV7.ts file
- [ ] Remove all `.method` properties from recording settings
- [ ] Flatten the settings structure (e.g., `recording.manual.navigator.selectedDeviceId` → `recording.manual.selectedDeviceId`)
- [ ] Create migration function from V6 to V7
  - [ ] Map `manual` mode with `tauri` method to new `cpal` mode
  - [ ] Map `manual` mode with `navigator` method to new `manual` mode
  - [ ] Remove method properties and flatten device settings

### 3. Update UI Components

#### Main Page (+page.svelte)
- [ ] Update toggle group to show 4 modes instead of 3
- [ ] Add grid layout adjustment (from `grid-cols-2` to `grid-cols-4` or appropriate layout)
- [ ] Update conditional rendering to handle 'cpal' mode
- [ ] Remove dynamic method references (e.g., `recording.manual.{currentMethod}.selectedDeviceId`)
- [ ] Simplify DeviceSelector props to use direct keys

#### Settings Page (settings/recording/+page.svelte)
- [ ] Remove manual method selector dropdown
- [ ] Update mode selector to include all 4 modes
- [ ] Simplify conditional UI logic for mode-specific settings
- [ ] Update device selector bindings

#### Config Layout (+layout.svelte)
- [ ] Update recording controls to handle 'cpal' mode
- [ ] Add appropriate icon/UI for cpal mode in header

### 4. Update Services Layer

#### services/index.ts
- [ ] Update `manualRecorder` getter to only return NavigatorRecorderService
- [ ] Add new `cpalRecorder` getter that returns TauriRecorderService (renamed to CpalRecorderService)
- [ ] Remove conditional logic based on `recording.manual.method`

#### Query Layer Updates
- [ ] Update query files to reference correct service based on mode
- [ ] Ensure commands use appropriate recorder service

### 5. Update Command System
- [ ] Add new commands for cpal recording (e.g., `toggleCpalRecording`, `cancelCpalRecording`)
- [ ] Update existing commands to work with simplified settings structure
- [ ] Update keyboard shortcuts configuration

### 6. Update Extension Integration
- [ ] Update extension to handle new recording modes
- [ ] Ensure extension only shows relevant modes (likely only manual and vad)

### 7. Global Search and Cleanup
- [ ] Search for all occurrences of `recording.*.method` pattern
- [ ] Search for all references to `MANUAL_RECORDING_METHODS`
- [ ] Update all dynamic settings key generation
- [ ] Remove any conditional logic based on recording methods

### 8. Testing and Validation
- [ ] Test manual recording mode (navigator)
- [ ] Test cpal recording mode
- [ ] Test VAD mode
- [ ] Test settings migration from V6 to V7
- [ ] Verify keyboard shortcuts work correctly
- [ ] Test device selection for each mode

## Implementation Notes

### Key Principles
1. **Simplicity**: Remove the nested method concept entirely
2. **Clarity**: Each mode should have a clear, single implementation
3. **Migration**: Ensure smooth upgrade path for existing users
4. **Platform Awareness**: Only show CPAL mode in desktop environment

### Breaking Changes
- Settings structure will change significantly
- Users will need to reconfigure their recording mode if they were using manual+tauri (now cpal)

### Benefits
1. Clearer mental model - each mode has one implementation
2. Simpler code - no nested conditionals for methods
3. Better UI - users can directly select their preferred recording approach
4. Easier to maintain - less complex state management

## Review
*To be completed after implementation*