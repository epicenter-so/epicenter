# CPAL Recorder Device Fallback Implementation

## Overview

Update the CPAL recorder service to gracefully handle cases where the selected device is null or invalid by falling back to the first available device, similar to the manual recorder implementation.

## Current Behavior

- `startRecording` directly passes `selectedDeviceId` to the Tauri backend
- No validation if the device exists
- No fallback if device is null or invalid

## Desired Behavior

- Check if selected device is null → use first available device
- Check if selected device exists in enumerated devices → use it if valid
- If selected device is invalid → use first available device
- Return a `DeviceAcquisitionOutcome` to indicate what happened

## Implementation Plan

### 1. Add DeviceAcquisitionOutcome Type

- [x] Add the same `DeviceAcquisitionOutcome` type from manualRecorder.ts
- [x] Import it or define it locally in cpalRecorder.ts

### 2. Update startRecording Method Signature

- [x] Change return type from `Result<void, RecordingServiceError>` to `Result<DeviceAcquisitionOutcome, RecordingServiceError>`

### 3. Implement Device Validation Logic

- [x] Call `enumerateRecordingDevices` at the start of `startRecording`
- [x] Check if `selectedDeviceId` is null
  - If null → use first device from enumerated list
  - Set outcome as fallback with reason 'no-device-selected'
- [x] Check if `selectedDeviceId` exists in enumerated devices
  - If exists → use it and set outcome as 'success'
  - If not exists → use first device and set outcome as fallback with reason 'preferred-device-unavailable'
- [x] Handle case where no devices are available at all

### 4. Update Status Messages

- [x] Add appropriate status messages for each scenario:
  - No device selected
  - Preferred device not found
  - Using fallback device

## Code Structure

```typescript
// Pseudo-code structure
async startRecording({selectedDeviceId}, {sendStatus}) {
  // 1. Enumerate devices
  const devices = await enumerateRecordingDevices();

  // 2. Determine which device to use
  let deviceToUse: string | null;
  let outcome: DeviceAcquisitionOutcome;

  if (!selectedDeviceId) {
    // No device selected - use first available
    deviceToUse = devices[0]?.deviceId || null;
    outcome = { outcome: 'fallback', reason: 'no-device-selected', fallbackDeviceId: deviceToUse };
  } else if (devices.find(d => d.deviceId === selectedDeviceId)) {
    // Selected device is valid
    deviceToUse = selectedDeviceId;
    outcome = { outcome: 'success' };
  } else {
    // Selected device not found - use first available
    deviceToUse = devices[0]?.deviceId || null;
    outcome = { outcome: 'fallback', reason: 'preferred-device-unavailable', fallbackDeviceId: deviceToUse };
  }

  // 3. Initialize recording with determined device
  // 4. Return outcome
}
```

## Testing Considerations

- Test with null device ID
- Test with valid device ID
- Test with invalid device ID
- Test when no devices are available

## Review

### Summary of Changes

1. **Added DeviceAcquisitionOutcome type** - Matches the type from manualRecorder.ts to indicate whether the preferred device was used or a fallback occurred
2. **Updated startRecording return type** - Now returns DeviceAcquisitionOutcome instead of void
3. **Implemented device validation logic**:
   - Enumerates devices at the start of startRecording
   - Validates if selected device exists in the list
   - Falls back to first available device when needed
   - Returns appropriate outcome based on what happened
4. **Added contextual status messages** - Different messages for "no device selected" vs "preferred device unavailable"
5. **Error handling** - Proper error messages when no devices are available

### Key Differences from Manual Recorder

- Does not attempt to connect to devices during validation (simpler approach)
- Uses the same DeviceAcquisitionOutcome type for consistency
- Maintains the same fallback behavior patterns
