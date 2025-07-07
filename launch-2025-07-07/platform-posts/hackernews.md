# Hacker News Launch Posts

## Primary Post (Day 1 - Traditional Angle)

### Title Options (Ranked by Viral Potential)

1. **Show HN: Open-source transcription app that costs $0.02/hour instead of $30/month** ⭐ RECOMMENDED
2. Show HN: I made a 50MB transcription app with Svelte 5 + Tauri (free, your API keys)
3. Show HN: Transcription apps charge $30/month for API wrappers. Here's my free alternative

### Post Content
I built Whispering as a completely free and open-source alternative to paid transcription apps. I believe transcription is too fundamental a tool to be locked behind paywalls.

Key features:
- 100% free and open source (MIT license)
- Bring your own API key (OpenAI Whisper, Groq, etc.)
- Built with Svelte 5 + Tauri for native performance (~50MB, instant startup)
- Your data never touches our servers - direct API calls only
- Cross-platform (macOS, Windows, Linux)

Technical highlights:
- One of the more complex Svelte 5 apps in production (extensive use of runes)
- Tauri for secure API key storage and native OS integration
- Real-time waveform visualization with efficient memory management
- Clean architecture that's actually educational to read

I've been using it daily for months (3-4 hours/day) before discovering that competitors charge $15-30/month for essentially the same API wrapper. With Whispering + Groq, I pay about $0.02/hour.

GitHub: [link]

Happy to answer questions about the implementation, architecture decisions, or how to build desktop apps with Svelte 5 + Tauri.

---

## Follow-up Post (Day 2-3 - Workflow Angle)

### Title Options
1. Show HN: How I code 3x faster using voice with Whispering + Claude Code
2. Show HN: My $0.02/hour voice coding setup that replaced typing
3. Show HN: Voice-driven development - Whispering + Claude Code workflow

### Post Content
Yesterday I shared Whispering, my open-source transcription app. Several people asked about my workflow, so here's how I actually use it to code faster than I can type.

My setup:
- Whispering in voice-activated mode (hands-free)
- Groq's Whisper API (near-instant transcription)
- Claude Code for the IDE integration
- Total cost: ~$0.02/hour

The workflow:
1. Think out loud about what I want to build
2. Whispering transcribes in real-time
3. Claude Code turns my words into actual code
4. I review and voice any corrections

Results:
- 3x faster than typing for boilerplate/CRUD operations
- Natural for explaining complex logic
- Great for documentation and comments
- Reduces RSI from typing

Video demo: [link] (shows actual coding session)

What surprised me most: I can maintain flow state better when speaking than typing. The constraint of speaking forces clearer thinking about what I want to build.

Technical details on the integration and voice activation logic in the repo: [link]

Has anyone else experimented with voice-driven development? What worked/didn't work for you?