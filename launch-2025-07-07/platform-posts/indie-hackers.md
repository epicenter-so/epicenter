# IndieHackers Post

## Title
I built my own transcription app instead of paying $5-15/month

## Post Content

Hey IH! 

**The backstory:** I needed transcription for my daily workflow. Found several apps charging monthly subscriptions. Built my own instead. Now it's free and open source.

**The numbers:**
- Competitors charge: $5-15/month ($60-180/year)
- My cost: ~$0.006 per minute using OpenAI directly
- My usage: ~2 hours/day = $0.72/day = $22/month in API costs
- Savings: $38-158/month

**The approach:**
Instead of building a SaaS, I built a desktop app where users bring their own API keys. This means:
- No server costs for me
- No subscription fees for users
- Users pay providers directly (cents, not dollars)
- Complete transparency on costs

**Tech stack:**
- Svelte 5 + Tauri (50MB download, instant startup)
- TypeScript for type safety
- Direct integration with OpenAI Whisper, Groq, etc.

**Distribution:**
- 100% open source on GitHub
- Auto-updater built in
- No analytics, no tracking

**Why this model works:**
1. Users who need transcription REALLY need it (multiple hours/day)
2. They're already paying for overpriced alternatives
3. Technical users appreciate the transparency
4. Non-technical users save money immediately

**Lessons for IndieHackers:**
- Not everything needs to be a SaaS
- Sometimes the best business model is no business model
- Open source can be a powerful distribution strategy
- Solving your own problem authentically resonates

**Current status:**
- Using it daily for months
- Ready for public launch
- No monetization planned (that's the point!)

GitHub: [link]

Would love to hear your thoughts on this approach. Anyone else building "anti-SaaS" tools?