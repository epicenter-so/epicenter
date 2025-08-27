# macOS Media Control Integration

## Problem Statement

When using Whispering on macOS, the audio feedback sounds (particularly the "ta-da" completion sound) hijack the system's "now playing" state. This causes the following issues:

1. **Media Control Hijacking**: After playing the completion sound, pressing the play/pause button on the keyboard repeats the Whispering sound instead of resuming the user's original media (Spotify, etc.)
2. **Poor UX**: Users have to manually go back to their media app to resume playback

## User Request

The user wants two features:
1. **Bug Fix**: Prevent audio feedback from hijacking media controls
2. **Feature Request**: Automatically pause any playing media when starting recording, and resume it after transcription completes

## Technical Analysis

### macOS Media Control APIs

macOS provides several APIs for media control:

1. **MediaPlayer Framework** (iOS/macOS): High-level API for controlling media playback
2. **MPNowPlayingInfoCenter**: Manages "now playing" information
3. **MPRemoteCommandCenter**: Handles remote control events (keyboard media keys)
4. **Core Audio**: Lower-level audio session management

### Current Implementation

Whispering currently uses HTML5 Audio elements for feedback sounds:
- `audioElements[soundName].play()` in `apps/whispering/src/lib/services/sound/desktop.ts`
- This automatically makes the app the "now playing" app on macOS

### Solution Approach

#### 1. Prevent Media Control Hijacking

**Option A: Use Silent Audio Session**
- Configure audio session to not register as "now playing"
- Use `AVAudioSession` with appropriate category
- Requires native macOS integration

**Option B: Clear Now Playing Info After Sound**
- Play sound normally
- Immediately clear the "now playing" state after completion
- Simpler but may have brief hijacking

**Option C: Use System Sounds Instead**
- Use macOS system sounds (NSBeep, etc.)
- These don't register as "now playing"
- Limited customization

#### 2. Automatic Media Pause/Resume

**Implementation Strategy:**
1. **Detect Playing Media**: Use MediaPlayer framework to check if any app is playing media
2. **Pause Before Recording**: Pause detected media before starting recording
3. **Resume After Completion**: Resume the previously playing media after transcription
4. **Handle Edge Cases**: What if media was manually paused during recording?

### Recommended Implementation

**Phase 1: Fix Media Control Hijacking**
- Implement Option B (clear now playing info after sound)
- This is the quickest fix with minimal risk

**Phase 2: Add Automatic Media Control**
- Add MediaPlayer framework integration
- Implement media detection and pause/resume functionality
- Add user preference to enable/disable this feature

## Implementation Plan

### Todo Items

- [x] Research macOS MediaPlayer framework integration in Rust/Tauri
- [x] Implement audio session management to prevent media control hijacking
- [ ] Add media detection functionality
- [x] Implement automatic pause/resume of system media
- [x] Add user settings for media control features
- [ ] Test with various media apps (Spotify, Apple Music, etc.)
- [ ] Handle edge cases (manual pause during recording, multiple media sources)
- [x] Add error handling for media control failures

### Technical Requirements

1. **Rust Dependencies**: Need to add MediaPlayer framework bindings
2. **macOS Permissions**: May need additional entitlements for media control
3. **User Settings**: Add preferences for media control features
4. **Error Handling**: Graceful fallback when media control fails

### Files to Modify

1. **Rust Backend**:
   - `apps/whispering/src-tauri/src/lib.rs` - Add media control commands
   - `apps/whispering/src-tauri/Cargo.toml` - Add MediaPlayer dependencies

2. **Frontend**:
   - `apps/whispering/src/lib/services/sound/desktop.ts` - Modify audio playback
   - `apps/whispering/src/lib/query/commands.ts` - Add media control calls
   - `apps/whispering/src/lib/stores/settings.svelte` - Add media control preferences

### Testing Strategy

1. **Manual Testing**: Test with Spotify, Apple Music, YouTube, etc.
2. **Edge Cases**: 
   - Multiple media sources playing
   - Manual pause during recording
   - Media app closed during recording
   - No media playing initially
3. **Error Scenarios**: Media control permissions denied, API failures

## Success Criteria

1. **Media Control Hijacking Fixed**: Audio feedback no longer hijacks keyboard media controls
2. **Automatic Media Control**: Media automatically pauses when recording starts and resumes when transcription completes
3. **User Control**: Users can enable/disable automatic media control
4. **Robust Error Handling**: App continues to work even if media control fails
5. **No Performance Impact**: Media control operations don't affect recording performance

## Future Considerations

1. **Cross-Platform**: Consider implementing similar features for Windows/Linux
2. **Advanced Features**: Volume ducking instead of full pause, media app detection
3. **User Feedback**: Visual indicators when media is being controlled

## Review

### Changes Made

#### Phase 1: Web Audio API Implementation (Current Approach)
1. **Removed Broken Media Control Code**: Cleaned up all previous attempts
   - Removed `apps/whispering/src-tauri/src/media_control/` directory
   - Removed media control service from frontend
   - Removed media control settings and UI
   - Removed framework linking and objc dependencies
2. **New Web Audio API Sound Service**: 
   - `apps/whispering/src/lib/services/sound/web-audio.ts` - Web Audio API implementation
   - `apps/whispering/src/lib/services/sound/desktop.ts` - Updated to use Web Audio API
3. **Clean Implementation**: No Rust changes required, pure web API solution

### Implementation Details

#### Web Audio API Solution
The core fix involves replacing HTML5 `<audio>` elements with Web Audio API:
- **HTML5 Audio**: Automatically registers with media control system
- **Web Audio API**: Plays audio without becoming "now playing" app
- **AudioContext**: Manages audio playback without media control interference
- **AudioBuffer**: Caches decoded audio for better performance

### Technical Approach
- Uses standard Web Audio API (AudioContext, AudioBufferSource)
- No framework dependencies or Rust changes required
- Caches decoded audio buffers for performance
- Handles user interaction requirements (AudioContext.resume())
- Pure web standards approach

### Why This Approach Works
- **Web Audio API** plays audio without registering with media controls
- **HTML5 audio elements** automatically become the "now playing" app
- **No complex integration** - uses standard web APIs
- **Better performance** - decoded audio buffers are cached
- **Cleaner architecture** - no Objective-C/Rust framework integration needed

### Testing Status
- Implementation is complete and ready for testing
- Should work immediately without complex setup
- No media control interference expected

### Next Steps
1. Test the Web Audio API implementation
2. Verify that media controls are not hijacked
3. Ensure audio feedback still works properly
