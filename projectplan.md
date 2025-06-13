# Removing Faster Rerecording Feature

## Analysis

The "faster rerecording" feature in the web recorder service attempts to keep MediaStream sessions open between recordings to reduce latency when starting new recordings. However, as identified by the user, this approach is prone to bugs and adds unnecessary complexity.

### Current Implementation:
1. **Session Persistence**: The `maybeCurrentSession` variable holds a `RecordingSession` that contains:
   - Recording settings
   - MediaStream
   - Recorder state (when actively recording)

2. **Session Reuse Logic**: In `startRecording`, the code checks if it can reuse the existing session by:
   - Checking if the stream is still active
   - Verifying settings haven't changed
   - Only creating a new session if necessary

3. **UI Integration**:
   - A setting `recording.isFasterRerecordEnabled` controls whether sessions persist
   - When disabled, `closeRecordingSession` is called after `stopRecording` or `cancelRecording`
   - A dedicated command exists to manually close recording sessions
   - User-facing dialog explains the feature's purpose and trade-offs

## Plan

### TODO Items:
- [ ] Remove the `recording.isFasterRerecordEnabled` setting from all settings schema files
- [ ] Remove the FasterRerecordExplainedDialog component and its imports
- [ ] Remove the faster rerecording switch from the settings page
- [ ] Simplify the web recorder service to always close sessions after recording
- [ ] Remove the dedicated `closeManualRecordingSession` command
- [ ] Update `stopRecording` and `cancelRecording` in commands.ts to always close the session
- [ ] Refactor the web recorder service to remove session persistence logic
- [ ] Inline the closeRecordingSession logic into stopRecording since it's the only place it's needed
- [ ] Consider if we need the SESSION state at all, or just IDLE and RECORDING states

### Key Decisions:
1. **Remove session persistence entirely** - Each recording will get a fresh MediaStream
2. **Simplify state management** - Only track IDLE vs RECORDING states
3. **Inline session cleanup** - Move closeRecordingSession logic directly into stopRecording/cancelRecording
4. **Remove intermediate SESSION state** - It serves no purpose without persistence

## Expected Benefits:
- Simpler, more predictable code flow
- Fewer edge cases around stale streams
- Clearer microphone access indicators for users
- Reduced complexity in state management

## Review

### Changes Made:
1. **Settings Schema Migration**: Created settingsV6 without the `recording.isFasterRerecordEnabled` setting
2. **UI Cleanup**: Removed FasterRerecordExplainedDialog component and its usage in settings page
3. **Command Removal**: Removed the `closeManualRecordingSession` command from the commands array
4. **Command Updates**: Modified `stopRecording` and `cancelRecording` to always close the session
5. **State Simplification**: Changed recording states from IDLE/SESSION/SESSION+RECORDING to just IDLE/RECORDING
6. **Web Recorder Refactor**: 
   - Removed session persistence (maybeCurrentSession)
   - Simplified to just track activeRecording when recording is in progress
   - Made closeRecordingSession a no-op for API compatibility
   - Stream is now acquired fresh for each recording and cleaned up immediately after

### Key Improvements:
- **Cleaner State Management**: No more intermediate SESSION state
- **Predictable Behavior**: Each recording gets a fresh stream, no reuse
- **Simpler Code**: Removed complex session reuse logic and conditional branches
- **Better Resource Management**: Streams are cleaned up immediately after use

### Notes:
- The `closeRecordingSession` method is kept as a no-op for API compatibility but could be removed in a future refactor
- All references to SESSION+RECORDING have been updated to RECORDING
- The microphone permission indicator will now accurately reflect when the app is using the microphone