# Reddit r/sveltejs Launch Post

## Title

I built a fully open-source transcription app with Svelte 5 + Tauri as a free alternative to paid apps

## Post Content

Hey r/sveltejs! 

I wanted to share Whispering, an open-source transcription app I built using Svelte 5 and Tauri. It's a completely free alternative to apps that charge paidnth for basic transcription.

**Why I'm sharing this here:**
- It's one of the more complex Svelte 5 apps in production
- Demonstrates modern Svelte 5 patterns and best practices
- Shows how to integrate Tauri for native desktop functionality
- Uses reactive state management across multiple windows
- Implements real-time audio processing with Svelte's reactivity

**Technical highlights:**
- Svelte 5 runes throughout ($state, $derived, $effect)
- Tauri for native OS integration and secure API key storage
- Component architecture following shadcn-svelte patterns
- TypeScript with strict mode
- Real-time waveform visualization
- **Dependency injection pattern for maximum code reuse**

**The ideology:**
I believe transcription should be free and open. You bring your own API key (OpenAI, Groq, etc.), and your data goes directly to the service - no middleman, no tracking, complete transparency.

**Code reuse pattern I'm proud of:**
The dependency injection approach has been incredibly helpful for sharing code between desktop and web versions. Check out the [services architecture](https://github.com/braden-w/whispering/tree/main/apps/app/src/lib/services) - it shows how to write business logic once and swap implementations at build time:

```typescript
// Same UI code works on desktop and web!
export const ClipboardServiceLive = window.__TAURI_INTERNALS__
  ? createClipboardServiceDesktop() 
  : createClipboardServiceWeb();
```

I've been using it daily for months and put a lot of effort into making the codebase clean and educational. Whether you're looking for a free transcription tool or want to learn from a production Svelte 5 app, I hope you find it useful!

GitHub: [link]

Happy to answer any questions about the implementation, architecture decisions, or Svelte 5 patterns used!