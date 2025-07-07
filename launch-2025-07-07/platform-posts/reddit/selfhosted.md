# Reddit r/selfhosted Post

## Title
Whispering - Self-hosted transcription using your own API keys (no subscription required)

## Post Content

Hey r/selfhosted!

I built Whispering because I was tired of transcription services that charge monthly fees for something you can essentially self-host.

**How it works:**
- Desktop app (not a web service)
- You provide your own API key (OpenAI, Groq, etc.)
- Direct API calls from your machine
- No intermediary servers
- Pay providers directly (typically $0.006/minute)

**Why this fits the self-hosted philosophy:**
- You control the entire pipeline
- No dependency on a third-party service
- Your data never leaves your control
- Transparent costs (see exactly what you pay)
- Can switch providers anytime

**Features:**
- Real-time transcription
- Multiple language support
- Export formats (TXT, SRT, JSON)
- Global hotkeys
- System tray integration
- Cross-platform (Mac, Windows, Linux)

**Tech stack:**
- Svelte 5 + Tauri (native desktop app)
- ~50MB download
- No Docker needed - runs natively
- Auto-updater for convenience

**Privacy:**
- 100% open source
- No telemetry or analytics
- API keys stored encrypted locally
- Audio processed on your machine, sent directly to your chosen API

While it's not self-hosted in the traditional sense (since it uses external APIs), it embodies the same principles: you own your data, you control your costs, and you're not locked into a subscription service.

GitHub: [link]

Perfect for those who want transcription without the SaaS lock-in!