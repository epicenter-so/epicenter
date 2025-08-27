# macOS Media Control Integration - Web Audio API Solution

## Problem Statement

When using Whispering on macOS, the audio feedback sounds (particularly the "ta-da" completion sound) hijack the system's "now playing" state. This causes the following issues:

1. **Media Control Hijacking**: After playing the completion sound, pressing the play/pause button on the keyboard repeats the Whispering sound instead of resuming the user's original media (Spotify, etc.)
2. **Poor UX**: Users have to manually go back to their media app to resume playback

## Root Cause Analysis

The issue occurs because HTML5 `<audio>` elements automatically register with macOS's media control system when they play. When `audio.play()` is called, the web app becomes the "now playing" application, which hijacks keyboard media controls.

## Solution: Web Audio API Implementation

Instead of trying to "fix" the media control system after the fact, we implemented a solution that avoids the problem entirely by using the Web Audio API instead of HTML5 audio elements.

### Technical Approach

**Before (Problematic):**
```javascript
// This automatically becomes "now playing" when it plays
const audio = new Audio('sound.mp3');
audio.play(); // Hijacks media controls!
```

**After (Fixed):**
```javascript
// This plays audio without touching media controls
const context = new AudioContext();
const source = context.createBufferSource();
source.buffer = audioBuffer;
source.connect(context.destination);
source.start(); // No media control interference!
```

### Implementation Details

1. **Web Audio API Service**: Created `src/lib/services/sound/web-audio.ts`
   - Uses `AudioContext` and `AudioBufferSource` for sound playback
   - Caches decoded audio buffers for better performance
   - Handles user interaction requirements (`AudioContext.resume()`)

2. **Updated Sound Service**: Modified `src/lib/services/sound/desktop.ts`
   - Replaced HTML5 audio elements with Web Audio API
   - Maintains the same interface for existing code

3. **No Framework Dependencies**: Pure web standards approach
   - No Rust changes required
   - No macOS framework integration needed
   - No complex Objective-C bindings

## Benefits

- **No Media Control Interference**: Audio feedback doesn't register with media controls
- **Better Performance**: Decoded audio buffers are cached
- **Cleaner Architecture**: Uses standard web APIs
- **Cross-Platform**: Works on all platforms without special handling
- **Maintainable**: No complex framework integration to maintain

## Testing

The solution has been tested and verified to:
- Play audio feedback sounds correctly
- Not interfere with system media controls
- Maintain the same user experience
- Work consistently across different scenarios

## Files Modified

- `src/lib/services/sound/web-audio.ts` - New Web Audio API implementation
- `src/lib/services/sound/desktop.ts` - Updated to use Web Audio API
- `docs/specs/20250121T143000-macos-media-control-integration.md` - This specification

## Future Considerations

This approach provides a solid foundation for any future audio-related features. The Web Audio API offers additional capabilities like:
- Volume control
- Audio effects and filters
- Real-time audio processing
- Better error handling and recovery
