# Reddit r/rust Launch Post

## Title

Built a desktop transcription app with Tauri - showcasing Rust's performance for real-time audio processing

## Post Content

Hey Rustaceans!

I wanted to share Whispering, an open-source transcription app I built using Tauri. It's a free alternative to subscription-based transcription services.

**Why I'm sharing in r/rust:**
- Tauri's Rust backend handles all the heavy lifting
- Demonstrates real-time audio processing with minimal resource usage
- Shows how Rust + web tech can create performant desktop apps
- ~50MB bundle size with instant startup

**Technical highlights:**
- Secure API key storage using Tauri's built-in encryption
- Native OS integration (system tray, global shortcuts)
- Cross-platform file handling and permissions
- Efficient IPC between Rust backend and Svelte frontend
- Memory-safe audio buffer management

**Performance wins from Rust/Tauri:**
- Near-zero idle CPU usage
- Minimal memory footprint (~100MB)
- Native performance for audio processing
- Secure by default architecture

The app lets users bring their own API keys (OpenAI, Groq, etc.) and make direct API calls, avoiding the middleman fees that competitors charge.

**Code reuse through dependency injection:**
One of Tauri's underappreciated benefits is enabling massive code reuse. Using build-time platform detection, I share ~95% of code between desktop and web versions:

```typescript
// Services detect platform at build time
export const HttpServiceLive = window.__TAURI_INTERNALS__
  ? createHttpServiceDesktop() // Uses Tauri's Rust HTTP client
  : createHttpServiceWeb();     // Uses browser fetch API
```

This pattern (detailed in [services/README.md](https://github.com/braden-w/whispering/tree/main/apps/app/src/lib/services)) means the Rust backend enables a desktop app while maintaining a unified codebase.

I've been impressed with how Tauri leverages Rust's strengths for desktop app development. The combination of Rust's performance and safety with modern web UI has been fantastic.

GitHub: [link]

Happy to discuss the Rust/Tauri implementation details or answer questions about building desktop apps with this stack!