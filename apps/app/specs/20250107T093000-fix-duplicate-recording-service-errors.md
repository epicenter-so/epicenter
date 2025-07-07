# Fix Duplicate Recording Service Errors

## Objective
1. Rename duplicate `RecordingServiceError` types to be service-specific
2. Update error handling to properly bubble up error messages from services

## Current Issues
- Multiple services (manual-recorder, cpal-recorder, device-stream) all define the same `RecordingServiceError` type
- Error handlers in commands.ts use hardcoded descriptions instead of bubbling up the actual error messages from services
- Services already provide detailed error messages but they're being overridden

## Todo List
- [x] Rename RecordingServiceError types to be service-specific
  - [x] manual-recorder.ts: RecordingServiceError → ManualRecorderServiceError
  - [x] cpal-recorder.ts: RecordingServiceError → CpalRecorderServiceError  
  - [x] device-stream.ts: RecordingServiceError → DeviceStreamServiceError
- [x] Update error handling in commands.ts to use error messages from services
- [x] Update VAD service error handling if needed
- [x] Transform service errors to WhisperingError at query layer
- [x] Apply destructuring pattern for better code readability
- [x] Verify all changes work correctly

## Implementation Plan

### 1. Rename Error Types
Each service should have its own specific error type:
- `ManualRecorderServiceError` for manual-recorder.ts
- `CpalRecorderServiceError` for cpal-recorder.ts
- `DeviceStreamServiceError` for device-stream.ts

### 2. Update Error Handling
In commands.ts, change error handling from:
```typescript
rpc.notify.error.execute({
  id: toastId,
  title: '❌ Failed to start recording',
  description: 'Your recording could not be started. Please try again.',
  action: { type: 'more-details', error: startRecordingError },
});
```

To:
```typescript
rpc.notify.error.execute({
  id: toastId,
  title: '❌ Failed to start recording',
  description: startRecordingError.message,
  action: { type: 'more-details', error: startRecordingError },
});
```

This will ensure the detailed error messages from services are shown to users.

## Review

### Changes Made

1. **Renamed Service Error Types**
   - `ManualRecorderServiceError` for manual-recorder.ts
   - `CpalRecorderServiceError` for cpal-recorder.ts  
   - `DeviceStreamServiceError` for device-stream.ts
   - Fixed error mapping in manual-recorder.ts when using device-stream functions

2. **Updated Error Handling in commands.ts**
   - Changed from hardcoded error descriptions to using `error.message`
   - Now properly bubbles up detailed error messages from services

3. **Transformed Errors at Query Layer**
   - Added error transformation in manualRecorder.ts and cpalRecorder.ts
   - Convert service-specific errors to WhisperingError with proper formatting
   - Applied destructuring pattern for cleaner code (e.g., `{ data: blob, error: stopRecordingError }`)

4. **Maintained VAD Service Pattern**
   - VAD service already uses WhisperingError directly, which is the desired pattern
   - No changes needed for VAD service

### Benefits
- No more duplicate error types across services
- Users see detailed, context-specific error messages
- Clean separation between service layer (TaggedError) and UI layer (WhisperingError)
- Better code readability with destructuring pattern
- Consistent error handling throughout the application