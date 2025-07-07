# Reddit r/sveltejs Launch Post

## Post Type: **Image Post (Screenshot of Svelte 5 Code)**

## Status: ✅ POSTED

## Posted URL: https://www.reddit.com/r/sveltejs/comments/1ltzyme/show_rsveltejs_whispering_an_production_svelte_5/

## Title

Show r/sveltejs: Whispering, an production Svelte 5 + Tauri desktop app

## Post Content


Hey r/sveltejs!

I wanted to share Whispering, a production Svelte 5 app I've been building. It's a free, open-source transcription tool that's saved me hundreds of dollars.

The Svelte 5 patterns in this codebase might interest you. I'm using runes extensively - `$state` for reactive UI, `$derived` for computed values, and `$effect` for side effects. The new reactivity system has been fantastic for managing real-time audio state.

One pattern I'm particularly proud of is using `createSubscriber` for event management. Check out [createPressedKeys.svelte.ts](https://github.com/braden-w/whispering/blob/main/apps/app/src/lib/utils/createPressedKeys.svelte.ts) - it only listens to keyboard events when components actually need them. Same pattern for [localStorage sync](https://github.com/braden-w/whispering/blob/main/apps/app/src/lib/utils/createPersistedState.svelte.ts). No memory leaks, automatic cleanup.

The architecture achieves 95% code sharing between desktop and web through dependency injection. Components don't know if they're running on Tauri or web - they just use services that get injected at build time. Details in the [service layer docs](https://github.com/braden-w/whispering/tree/main/apps/app/src/lib/services#readme).

I'm also using TanStack Query with Svelte 5, which has been a great combination. The query layer handles all the async state management while Svelte runes handle the UI reactivity.

Why I built this: transcription apps charge $30/month for what's basically an API wrapper. With Whispering, you bring your own API key and pay cents directly to providers. I use it 3-4 hours daily and pay about $3/month.

The codebase is clean and well-documented if you want to see Svelte 5 patterns in production. Using shadcn-svelte components, wellcrafted for error handling, and modern TypeScript throughout.

GitHub: https://github.com/braden-w/whispering

Happy to discuss any of the Svelte 5 patterns or architecture decisions!

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