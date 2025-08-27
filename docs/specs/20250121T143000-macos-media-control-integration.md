# macOS Media Control Integration - Web Audio API Solution

## Problem Statement

When using Whispering on macOS, the audio feedback sounds (particularly the "ta-da" completion sound) hijack the system's "now playing" state. This causes the following issues:

1. **Media Control Hijacking**: After playing the completion sound, pressing the play/pause button on the keyboard repeats the Whispering sound instead of resuming the user's original media (Spotify, etc.)
2. **Poor UX**: Users have to manually go back to their media app to resume playback

## Root Cause Analysis

The issue occurs because HTML5 `<audio>` elements automatically register with macOS's media control system when they play. When `audio.play()` is called, the web app becomes the "now playing" application, which hijacks keyboard media controls.

## Solution: Web Audio API Implementation

We replaced HTML5 audio elements with Web Audio API to avoid media control interference.

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
   - Caches decoded audio buffers to avoid repeated decoding
   - Handles user interaction requirements (`AudioContext.resume()`)

2. **Updated Sound Service**: Modified `src/lib/services/sound/desktop.ts`
   - Replaced HTML5 audio elements with Web Audio API
   - Maintains the same interface for existing code

### Trade-offs and Considerations

**What We Gained:**
- ✅ Audio feedback no longer hijacks media controls
- ✅ Audio buffers are cached after first load (slight performance improvement)

**What We Lost/Added:**
- ❌ **Code Duplication**: Sound file imports are now defined in two places
  - `src/lib/services/sound/assets/index.ts` (original HTML5 audio elements)
  - `src/lib/services/sound/web-audio.ts` (new Web Audio API mapping)
- ❌ **More Complex Implementation**: Web Audio API requires more setup than HTML5 audio
- ❌ **Maintenance Overhead**: Need to keep both sound mappings in sync when adding new sounds

**Technical Debt Created:**
- The original `audioElements` object in `assets/index.ts` is now unused but still exists
- Sound file imports are duplicated across two files
- Future sound additions require updates in both places

### Files Modified

- `src/lib/services/sound/web-audio.ts` - New Web Audio API implementation
- `src/lib/services/sound/desktop.ts` - Updated to use Web Audio API
- `docs/specs/20250121T143000-macos-media-control-integration.md` - This specification

### Future Cleanup Needed

To properly complete this implementation, we should:
1. Remove the unused `audioElements` object from `assets/index.ts`
2. Create a shared sound mapping to eliminate duplication
3. Consider if the original assets file is still needed

### Testing

The solution has been tested and verified to:
- Play audio feedback sounds correctly
- Not interfere with system media controls
- Maintain the same user experience

## Conclusion

This fix resolves the media control hijacking issue but introduces some technical debt through code duplication. The trade-off was acceptable given the user experience improvement, but the implementation should be cleaned up in a future iteration.
