# Reddit r/sveltejs Launch Post

## Post Type: **Image Post (Screenshot of Svelte 5 Code)**

## Status: ✅ POSTED

## Posted URL: https://www.reddit.com/r/sveltejs/comments/1ltzyme/show_rsveltejs_whispering_an_production_svelte_5/

## Title

Show r/sveltejs: Whispering, an production Svelte 5 + Tauri desktop app

## Post Content


Hey r/sveltejs!

I wanted to share Whispering, a complex production Svelte 5 app I built with several hundred GitHub stars. It's completely free and open-source, built as an alternative to apps that charge $30/month for API wrappers.

Full project details: [https://github.com/braden-w/whispering#readme](https://github.com/braden-w/whispering#readme)

**What makes this interesting for Svelte devs:**

* Extensive use of Svelte 5 runes (`$state`, `$derived`, `$effect`) in production
* Clean component architecture following `shadcn-svelte` patterns
* Complex state management with `TanStack Query` integration
* Using `createSubscriber` for syncing persisted state and syncing keyboard shortcuts and to window event listeners on `keydown` and `storage` events
* \~95% code sharing between desktop and web versions through a [service layer](https://github.com/braden-w/whispering/tree/main/apps/app/src/lib/services#readme) with dependency injection for platform abstraction, [query layer](https://github.com/braden-w/whispering/tree/main/apps/app/src/lib/query#readme) using TanStack Query for reactive state
* `createSubscriber` for [keyboard management](https://github.com/braden-w/whispering/blob/main/apps/app/src/lib/utils/createPressedKeys.svelte.ts) and [localStorage sync](https://github.com/braden-w/whispering/blob/main/apps/app/src/lib/utils/createPersistedState.svelte.ts)
* Error handling with `result` types (`wellcrafted` pattern)

**Why open source:** Transcription shouldn't cost $30/month. With Whispering, you bring your own API key (OpenAI, Groq, etc.) and pay providers directly, typically $0.02-0.18/hour. No middleman, no tracking, your data stays yours.

I've been using it daily for months and put a lot of effort into making the codebase clean and educational. Whether you're looking for a free transcription tool or want to learn from a production Svelte 5 app, I hope you find it useful!

**GitHub:** [**https://github.com/braden-w/whispering#readme**](https://github.com/braden-w/whispering#readme)

Happy to answer any questions about the implementation, architecture decisions, or Svelte 5 patterns used!

---

## Comment 1: Code Reuse Pattern with Dependency Injection

One pattern I'm really proud of is how we achieved ~95% code sharing between desktop and web versions using dependency injection.

The approach has been incredibly helpful - we write business logic once and swap implementations at build time. Check out the [services architecture](https://github.com/braden-w/whispering/tree/main/apps/app/src/lib/services#readme):

```typescript
// Same UI code works on desktop and web!
export const ClipboardServiceLive = window.__TAURI_INTERNALS__
  ? createClipboardServiceDesktop() 
  : createClipboardServiceWeb();
```

This pattern means:
- Components don't know or care if they're running on desktop or web
- Business logic is written once and tested once
- Platform-specific code is isolated to service implementations
- Adding new platforms (mobile?) would be straightforward

The [service layer docs](https://github.com/braden-w/whispering/tree/main/apps/app/src/lib/services#readme) show more examples of how this works with file system access, global shortcuts, and other platform-specific features.

---

## Comment 2: Novel Use of `createSubscriber` 

Another interesting pattern: We use `createSubscriber` for [keyboard shortcut management](https://github.com/braden-w/whispering/blob/main/apps/app/src/lib/utils/createPressedKeys.svelte.ts) and [localStorage sync](https://github.com/braden-w/whispering/blob/main/apps/app/src/lib/utils/createPersistedState.svelte.ts).

`createSubscriber` is perfect for managing event listeners that should only be active when the state is actually being observed. For example:

- **Keyboard management**: Only listens to keyboard events when a component actually needs to know about pressed keys
- **localStorage sync**: Only syncs with localStorage and listens for storage events when the persisted state is being used

This prevents memory leaks and improves performance by automatically cleaning up listeners when components unmount.

I found this pattern so useful that I submitted a PR for better `createSubscriber` docs: https://github.com/sveltejs/svelte/pull/16310

Check out the implementations:
- [createPressedKeys.svelte.ts](https://github.com/braden-w/whispering/blob/main/apps/app/src/lib/utils/createPressedKeys.svelte.ts) - Reactive keyboard state management
- [createPersistedState.svelte.ts](https://github.com/braden-w/whispering/blob/main/apps/app/src/lib/utils/createPersistedState.svelte.ts) - Type-safe localStorage with cross-tab sync