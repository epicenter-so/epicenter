# Decouple Recorder Services Plan

## Overview
Refactor the recorder services to decouple them from the `recorder/` folder structure and align with the pattern used by `vad.ts`. This involves:
1. Renaming `web.ts` to `manualRecorder.ts` and moving it to the same level as `vad.ts`
2. Moving `cpal.ts` to the same level as `vad.ts`
3. Removing `_types.ts` and embedding types where needed
4. Simplifying cpal recorder to not require full `RecorderSessionSettings`

## Current Structure
```
services/
├── recorder/
│   ├── _types.ts (contains RecordingServiceError, RecorderService, RecordingSessionSettings, etc.)
│   ├── web.ts (manual recorder implementation)
│   └── cpal.ts (Tauri/desktop recorder implementation)
└── vad.ts (example of desired pattern)
```

## Target Structure
```
services/
├── manualRecorder.ts (formerly recorder/web.ts)
├── cpalRecorder.ts (formerly recorder/cpal.ts)
└── vad.ts (existing, good pattern to follow)
```

## Todo Items

### 1. Extract and embed types from _types.ts
- [ ] Copy necessary types directly into `manualRecorder.ts` and `cpalRecorder.ts`
- [ ] Remove the shared `RecorderService` interface - each file will define its own return type
- [ ] Keep types minimal and co-located with their usage

### 2. Move and rename web.ts to manualRecorder.ts
- [ ] Create new file `apps/app/src/lib/services/manualRecorder.ts`
- [ ] Copy content from `recorder/web.ts`
- [ ] Update imports to remove references to `./_types`
- [ ] Embed necessary types directly in the file
- [ ] Export a single function `createManualRecorderService()` that returns the service object

### 3. Move and rename cpal.ts to cpalRecorder.ts
- [ ] Create new file `apps/app/src/lib/services/cpalRecorder.ts`
- [ ] Copy content from `recorder/cpal.ts`
- [ ] Update imports to remove references to `./_types`
- [ ] Embed necessary types directly in the file
- [ ] Simplify `startRecording` in cpalRecorder.ts to only require `selectedDeviceId` (not full settings)
- [ ] Export a single function `createCpalRecorderService()` that returns the service object

### 4. Update service imports in index.ts
- [ ] Update imports from `./recorder/web` to `./manualRecorder`
- [ ] Update imports from `./recorder/cpal` to `./cpalRecorder`
- [ ] Update function calls to use new names

### 5. Update query imports
- [ ] Update `apps/app/src/lib/query/_queries/manualRecorder.ts` to remove recorder type imports
- [ ] Update `apps/app/src/lib/query/_queries/cpalRecorder.ts` to remove recorder type imports
- [ ] Ensure both query files work with the embedded types

### 6. Clean up old files
- [ ] Delete `apps/app/src/lib/services/recorder/_types.ts`
- [ ] Delete `apps/app/src/lib/services/recorder/web.ts`
- [ ] Delete `apps/app/src/lib/services/recorder/cpal.ts`
- [ ] Remove the empty `recorder/` directory

### 7. Verify and test
- [ ] Ensure all imports are updated
- [ ] Check that the services work correctly
- [ ] Verify type safety is maintained

## Key Design Decisions

1. **No shared types**: Following the `vad.ts` pattern, each recorder service will define its own types inline
2. **Simplified interface**: The cpal recorder will be simplified to only need `selectedDeviceId` instead of full settings
3. **Co-located types**: All types will be defined in the same file where they're used
4. **Consistent naming**: Services are named after their implementation (manual, cpal) not their platform (web, desktop)

## Notes
- The `bitrateKbps` setting is only used by the manual recorder (for MediaRecorder configuration)
- The cpal recorder doesn't need bitrate settings as it records raw audio
- Both services will maintain their existing error handling patterns but with embedded error types