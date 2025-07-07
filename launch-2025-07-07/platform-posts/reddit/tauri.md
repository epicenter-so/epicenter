# Reddit r/tauri Launch Post

## Post Type: **Image Post (App Screenshot showing lightweight bundle)**

## Title

Show r/tauri: Production app with ~22MB bundle, global shortcuts, and 95% code sharing between desktop/web

## Post Content

Hey r/tauri!

I wanted to share Whispering, a transcription app I built with Tauri that's been in production for months. The bundle is just 22MB on macOS and I've achieved 95% code sharing between desktop and web versions.

The killer Tauri feature for me was build-time dependency injection. Instead of maintaining two codebases, I detect the platform and inject the right implementation:

```typescript
// Platform detection at build time
export const ClipboardServiceLive = window.__TAURI_INTERNALS__
  ? createClipboardServiceDesktop() // Tauri APIs
  : createClipboardServiceWeb();     // Browser APIs
```

This pattern (detailed in [services/README.md](https://github.com/braden-w/whispering/tree/main/apps/app/src/lib/services)) means I write business logic once. The desktop app gets native performance, system tray, global shortcuts - while the web version uses browser APIs. Same UI, same logic, different runtime.

Performance has been stellar. The app starts instantly, idles at near-zero CPU, and uses about 100MB RAM. Compare that to Electron alternatives that start at 150MB+ just to show a window.

Some Tauri challenges I solved:
- Global shortcuts that actually work across all three OS (harder than it sounds)
- Smooth auto-updater experience without annoying users
- Managing shared state across multiple windows
- System tray with proper OS integration

The app itself solves a real problem - transcription services charging $30/month for API wrappers. With Whispering, you bring your own API key and pay cents directly to providers. Been using it daily and it's saved me hundreds.

Built with Svelte 5 + Tauri. The combination of Rust backend performance and modern web UI has been fantastic.

GitHub: https://github.com/braden-w/whispering

Happy to dive deep on any Tauri implementation details. What patterns have worked well for your Tauri apps?