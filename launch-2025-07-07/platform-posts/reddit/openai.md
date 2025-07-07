# Reddit r/OpenAI Launch Post

## Title

I built a free, open-source app that connects directly to the Whisper API - no middleman, no subscriptions

## Post Content

Hey r/OpenAI!

I built Whispering, a desktop app that connects directly to OpenAI's Whisper API for transcription. It's completely free and open source.

**How it works:**
- You provide your own OpenAI API key
- The app makes direct calls to the Whisper API
- Pay only for what you use (typically cents per hour)
- Your audio goes straight to OpenAI - no intermediary servers

**Technical details:**
- Supports all Whisper models (whisper-1)
- Real-time transcription with streaming
- Automatic language detection
- Custom prompts for domain-specific vocabulary
- Cross-platform (Mac, Windows, Linux)

**Why I built this:**
I was frustrated seeing apps charging monthly subscriptions for what's essentially a UI wrapper around the Whisper API. With your own API key, you maintain full control and transparency over costs.

**Privacy first:**
Since you're using your own API key, you have the same privacy guarantees as using the OpenAI API directly. The app is open source, so you can verify that no data is collected or transmitted elsewhere.

Built with Svelte 5 + Tauri for native performance.

GitHub: [link]

Happy to answer questions about the implementation or Whisper API integration!