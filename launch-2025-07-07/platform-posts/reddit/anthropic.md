# Reddit r/Anthropic Launch Post

## Title

How I use Claude Code + Whispering (my free transcription app) for 3x faster coding

## Post Content

Hey r/Anthropic!

I wanted to share a workflow that's transformed how I code with Claude. I built Whispering, a free open-source transcription app, and the combination with Claude Code has been incredible.

**The workflow:**
1. I speak my thoughts naturally while coding
2. Whispering transcribes in real-time (using OpenAI Whisper API)
3. I paste the transcription into Claude Code
4. Claude understands my intent and generates/refactors code

**Why this works so well:**
- Speaking is 3x faster than typing
- Natural language captures intent better than trying to write precise prompts
- Claude excels at understanding conversational context
- The feedback loop is incredibly fast

**About Whispering:**
- 100% free and open source
- You bring your own API key (OpenAI, Groq, etc.)
- Direct API calls - your audio never touches our servers
- Built with Svelte 5 + Tauri

I've included a demo video showing this workflow in action. The "vibe coding" approach lets me describe what I want naturally, and Claude just gets it.

**Watch the workflow:**
- 3-minute voice coding demo: https://youtube.com/shorts/tP1fuFpJt7g
- Shows the actual speed difference and how natural it feels

GitHub: https://github.com/braden-w/whispering

Would love to hear how others are combining voice input with AI coding assistants!