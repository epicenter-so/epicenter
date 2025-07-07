# Dev.to Article

## Title
I Built a Free, Open-Source Alternative to Paid Transcription Apps with Svelte 5 + Tauri

## Tags
#opensource #svelte #tauri #showdev

## Content

I was paying for transcription apps until I realized I could build something better - and make it free for everyone.

## The Problem

Transcription apps charge monthly subscriptions for what's essentially a wrapper around APIs. You're paying a middleman to relay your audio to the same services you could access directly.

## The Solution: Whispering

I built Whispering as a completely free, open-source alternative. Here's how it works:

- **You bring your own API key** (OpenAI Whisper, Groq, etc.)
- **Direct API calls** - no middleman servers
- **Pay cents, not dollars** - only for what you use
- **100% open source** - audit the code yourself

## Technical Stack

I chose Svelte 5 + Tauri for several reasons:

### Why Svelte 5?
```javascript
// Using the new runes for reactive state
let recording = $state(false);
let transcription = $state('');

$effect(() => {
  if (recording) {
    startAudioCapture();
  }
});
```

The new runes system made state management incredibly clean, especially for real-time audio processing.

### Why Tauri?
- **Small bundle size**: ~50MB vs 150MB+ for Electron
- **Native performance**: Rust backend for audio processing
- **Security**: Built-in encryption for API key storage
- **Cross-platform**: Single codebase for Mac/Windows/Linux

## Key Features Implemented

### 1. Real-time Transcription
Stream audio directly to the API while recording for instant results.

### 2. Global Shortcuts
System-wide hotkeys for hands-free operation - crucial for productivity.

### 3. Overlay Mode
Transcribe over any application without switching contexts.

### 4. Privacy First
Your API key is encrypted locally. Audio goes directly to your chosen provider. No telemetry, no tracking.

## Architecture Decisions

### Frontend Architecture
```
src/
├── lib/
│   ├── stores/      # Svelte stores for state
│   ├── components/  # Reusable UI components
│   ├── services/    # API integration
│   └── utils/       # Helper functions
```

### Tauri Commands
```rust
#[tauri::command]
async fn start_recording(state: State<'_, AppState>) -> Result<(), String> {
    // Direct integration with OS audio APIs
}
```

## Lessons Learned

1. **Svelte 5 runes are production-ready** - The new reactivity system is a joy to work with
2. **Tauri delivers on its promises** - Native performance with web technologies
3. **Users want transparency** - Open source + bring-your-own-key resonates

## The Philosophy

I believe essential productivity tools should be:
- Free and accessible to everyone
- Transparent in how they work
- Respectful of user privacy
- Community-driven, not corporation-driven

## Try It Yourself

The entire codebase is available on GitHub. Whether you want to use it, learn from it, or contribute to it - you're welcome!

**GitHub**: [link]

I'd love to hear your thoughts and feedback. What features would make this more useful for your workflow?

---

*If you're building with Svelte 5 or Tauri, I'm happy to discuss implementation details in the comments!*