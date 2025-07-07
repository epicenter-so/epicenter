# Reddit r/tauri Launch Post

## Title

Whispering - A production Tauri app for transcription (open source)

## Post Content

Hey r/tauri!

I wanted to share Whispering, a transcription app I built with Tauri. It's completely free, open source, and showcases some interesting Tauri patterns.

**Tauri implementation highlights:**
- System tray integration with global shortcuts
- Secure storage for API keys using Tauri's built-in encryption
- Native file system access for audio processing
- Custom window management for overlay mode
- IPC commands for real-time audio streaming
- Auto-updater integration

**Architecture decisions:**
- Frontend: Svelte 5 with TypeScript
- Audio processing: Web Audio API → Tauri command
- State management: Svelte stores + Tauri state
- Permissions: Minimal required (audio, file system)

**Performance wins with Tauri:**
- 50MB app size vs 150MB+ Electron equivalent
- Native performance for audio processing
- Instant startup time
- Low memory footprint

**Interesting challenges solved:**
- Streaming audio data efficiently through IPC
- Managing multiple windows with shared state
- Implementing global shortcuts that work across OS
- Building a smooth auto-update experience

The app connects directly to transcription APIs (OpenAI Whisper, Groq) using user-provided keys, keeping it free while maintaining privacy.

GitHub: [link]

Happy to discuss any Tauri-specific implementation details or answer questions about the architecture!