# Reddit r/tauri Launch Post

## Title

Whispering - A production Tauri app for transcription (open source)

## Post Content

Hey r/tauri!

I wanted to share Whispering, a transcription app I built with Tauri. It's completely free, open source, and showcases some interesting Tauri patterns.

**Tauri implementation highlights:**
- System tray integration with global shortcuts
- Auto-updater integration
- **Build-time dependency injection for maximum code reuse**

**Architecture decisions:**
- Frontend: Svelte 5 with TypeScript
- Services layer with dependency injection (see [services/README.md](https://github.com/braden-w/whispering/tree/main/apps/app/src/lib/services))
- Platform detection at build time: `window.__TAURI_INTERNALS__`
- Shared business logic between desktop and web versions
- Permissions: Minimal required (audio, file system)

**Performance wins with Tauri:**
- 50MB app size vs 150MB+ Electron equivalent
- Native performance for audio processing
- Instant startup time
- Low memory footprint

**Code reuse technique that's been incredibly helpful:**
Instead of maintaining separate web and desktop codebases, I use build-time dependency injection:

```typescript
// Platform detection at build time
export const ClipboardServiceLive = window.__TAURI_INTERNALS__
  ? createClipboardServiceDesktop() // Tauri APIs
  : createClipboardServiceWeb();     // Browser APIs
```

This enables ~95% code sharing between desktop and web versions. The UI and business logic are identical - only the thin service layer varies. Check out the [services architecture](https://github.com/braden-w/whispering/tree/main/apps/app/src/lib/services) for details.

**Other challenges solved:**
- Managing multiple windows with shared state
- Implementing global shortcuts that work across OS
- Building a smooth auto-update experience

The app connects directly to transcription APIs (OpenAI Whisper, Groq) using user-provided keys, keeping it free while maintaining privacy.

GitHub: [link]

Happy to discuss any Tauri-specific implementation details or answer questions about the architecture!