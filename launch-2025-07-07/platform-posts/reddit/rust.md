# Reddit r/rust Launch Post

## Title

Built a desktop transcription app with Tauri - showcasing Rust's performance for real-time audio processing

## Post Content

Hey Rustaceans!

I built a transcription app with Tauri and the Rust performance benefits have been incredible. Whispering is a free, open-source alternative to those $30/month transcription services.

What impressed me most about Tauri: the final bundle is just 22MB on macOS and starts instantly. Near-zero idle CPU, about 100MB memory usage. Compare that to Electron apps that start at 150MB+ just to show "Hello World".

The Rust backend handles all the security-critical stuff - encrypted API key storage, native OS integration for global shortcuts, and audio buffer management. Tauri's IPC is blazing fast between the Rust backend and Svelte frontend.

One pattern I'm really proud of is how Tauri enabled 95% code reuse between desktop and web versions:

```typescript
// Services detect platform at build time
export const HttpServiceLive = window.__TAURI_INTERNALS__
  ? createHttpServiceDesktop() // Uses Tauri's Rust HTTP client
  : createHttpServiceWeb();     // Uses browser fetch API
```

This means I write business logic once and Rust handles the desktop-specific heavy lifting. Details in [services/README.md](https://github.com/braden-w/whispering/tree/main/apps/app/src/lib/services).

The app itself solves a real problem - transcription services charging 10x markup on API calls. With Whispering, you bring your own API key and pay providers directly. About $0.02/hour instead of $30/month.

Been using it daily for months. The combination of Rust's performance guarantees and Tauri's small footprint makes it feel like a native app, not a web wrapper.

GitHub: https://github.com/braden-w/whispering

Happy to dive into implementation details or discuss Tauri patterns. Anyone else building desktop apps with Rust?