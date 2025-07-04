<p align="center">
  <a href="https://whispering.bradenwong.com">
    <img width="180" src="./apps/app/src-tauri/recorder-state-icons/studio_microphone.png" alt="Whispering">
  </a>
  <h1 align="center">Whispering</h1>
  <p align="center">Press shortcut → speak → get text. Free and open source.</p>
</p>

<p align="center">
  <!-- Latest Version Badge -->
  <img src="https://img.shields.io/github/v/release/braden-w/whispering?style=flat-square&label=Latest%20Version&color=brightgreen" />
  <!-- License Badge -->
  <a href="LICENSE" target="_blank">
    <img alt="MIT License" src="https://img.shields.io/github/license/braden-w/whispering.svg?style=flat-square" />
  </a>
  <!-- Platform Support Badges -->
  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="macOS" src="https://img.shields.io/badge/-macOS-black?style=flat-square&logo=apple&logoColor=white" />
  </a>
  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="Windows" src="https://img.shields.io/badge/-Windows-blue?style=flat-square&logo=windows&logoColor=white" />
  </a>
  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="Linux" src="https://img.shields.io/badge/-Linux-yellow?style=flat-square&logo=linux&logoColor=white" />
  </a>
  <!-- Tech Stack Badges -->
  <img alt="Svelte 5" src="https://img.shields.io/badge/-Svelte%205-orange?style=flat-square&logo=svelte&logoColor=white" />
  <img alt="Tauri" src="https://img.shields.io/badge/-Tauri-blue?style=flat-square&logo=tauri&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-blue?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Rust" src="https://img.shields.io/badge/-Rust-orange?style=flat-square&logo=rust&logoColor=white" />
</p>

## What is Whispering?

Press a shortcut anywhere on your desktop → speak → get text in your clipboard. That's it.

**Try it in 2 minutes:** [Quick Start](#quick-start) | [Watch Demo (30s)](#demo)

Whispering is the transcription app I built because I believe productivity tools should be free and accessible to everyone.

Whispering is free and open source—you own your data, you audit the code, and you control your privacy.

Bring your own API key from providers like `OpenAI`, `Groq`, or `ElevenLabs`, and pay only cents per hour instead of monthly subscriptions. Or use a local transcription service like `Speaches`, which keeps everything free and on-device. Your audio goes directly to your chosen service.

Open source. No tracking. No paywalls.

> **Note**: Whispering is designed for quick transcriptions, not long recordings. For extended recording sessions, use a dedicated recording app.

## Demo

https://github.com/user-attachments/assets/eca93701-10a0-4d91-b38a-f715bd7e0357

## Why I Built This

I was tired of the usual SaaS problems:

- **The pricing was nuts.** Most transcription services charge $15-30/month for what should cost at most $2. You're paying for their profit margin.
- **You have no idea what happens to your recordings.** Your recordings get uploaded to someone else's servers, processed by their systems, and stored according to their privacy policy.
- **Limited options.** Most services use OpenAI's Whisper behind the scenes anyway, but you can't switch providers, can't use faster models, and can't go local when you need privacy.
- **Things just disappear.** Companies pivot, get acquired, or shut down. Then you're stuck migrating your workflows and retraining your muscle memory.

So I built Whispering the way transcription should work:

- **No middleman** - Your audio goes straight to the provider you choose (or stays fully local)
- **Your keys, your costs** - Pay OpenAI/Groq/whoever directly at actual rates: $0.02-$0.18/hour instead of $20/month
- **Actually yours** - Open source means no one can take it away, change the pricing, or sunset the service

### Cost Comparison

With Whispering, you pay providers directly instead of marked-up subscription prices:

| Service | Cost per Hour | Light Use (20 min/day) | Moderate Use (1 hr/day) | Heavy Use (3 hr/day) | Traditional Tools |
|---------|---------------|------------------------|-------------------------|----------------------|-------------------|
| `distil-whisper-large-v3-en` (Groq) | $0.02 | $0.20/month | $0.60/month | $1.80/month | $15-30/month |
| `whisper-large-v3-turbo` (Groq) | $0.04 | $0.40/month | $1.20/month | $3.60/month | $15-30/month |
| `gpt-4o-mini-transcribe` (OpenAI) | $0.18 | $1.80/month | $5.40/month | $16.20/month | $15-30/month |
| Local (Speaches) | $0.00 | $0.00/month | $0.00/month | $0.00/month | $15-30/month |

## Quick Start

**Get transcribing in 2 minutes** → Press shortcut, speak, get text

### 1️⃣ Install Whispering

Visit the [GitHub Releases page](https://github.com/braden-w/whispering/releases/latest) and download the right version for your system:

<details>
<summary><strong>🍎 macOS</strong></summary>

**Choose your version:**
- **Apple Silicon** (M1/M2/M3): `Whispering_x.x.x_aarch64.dmg`
- **Intel**: `Whispering_x.x.x_x64.dmg`

<details>
<summary>Not sure which Mac you have?</summary>

Click the Apple menu → About This Mac:
- If you see "Apple M1/M2/M3", download `aarch64.dmg`
- If you see "Intel", download `x64.dmg`

</details>

**Installation:**
1. Download the `.dmg` file
2. Double-click to open
3. Drag Whispering to your Applications folder
4. Open Whispering from your Applications folder

<details>
<summary><strong>Troubleshooting</strong></summary>

**If you see "Unverified developer" warning:**
- Right-click the app → select "Open"

**Apple Silicon users - If you see "app is damaged":**
- Run this command in Terminal: `xattr -cr /Applications/Whispering.app`

</details>

</details>

<details>
<summary><strong>🪟 Windows</strong></summary>

**Download:**
- Installer: `Whispering_x.x.x_x64_en-US.msi` (recommended)
- Alternative: `Whispering_x.x.x_x64-setup.exe`

**Installation:**
1. Download the `.msi` installer
2. Double-click to run
3. If Windows Defender appears: Click "More Info" → "Run Anyway"
4. Follow the installation wizard

</details>

<details>
<summary><strong>🐧 Linux</strong></summary>

**Choose your format:**
- **AppImage** (universal): `Whispering_x.x.x_amd64.AppImage`
- **Debian/Ubuntu**: `Whispering_x.x.x_amd64.deb`
- **Fedora/RHEL**: `Whispering-x.x.x-1.x86_64.rpm`

**Installation:**

<details>
<summary>AppImage</summary>

```bash
chmod +x Whispering_x.x.x_amd64.AppImage
./Whispering_x.x.x_amd64.AppImage
```

</details>

<details>
<summary>DEB (Debian/Ubuntu)</summary>

```bash
sudo dpkg -i Whispering_x.x.x_amd64.deb
```

</details>

<details>
<summary>RPM (Fedora/RHEL)</summary>

```bash
sudo rpm -i Whispering-x.x.x-1.x86_64.rpm
```

</details>

</details>

<details>
<summary><strong>🌐 Web App</strong></summary>

No installation needed! Visit [whispering.bradenwong.com](https://whispering.bradenwong.com) in your browser. The web version has most but not all features of the desktop app (no global shortcuts).

</details>

### 2️⃣ Get Your API Key (30 seconds)

Right now, I personally use **Groq** for almost all my transcriptions.

> 💡 **Why Groq?** The fastest models, super accurate, generous free tier, and unbeatable price (as cheap as $0.02/hour)

1. Visit [console.groq.com/keys](https://console.groq.com/keys)
2. Sign up → Create API key → Copy it

**🙌 That's it!** No credit card required for the free tier. You can start transcribing immediately.

### 3️⃣ Connect & Test

1. Open Whispering
2. Click **Settings** (⚙️) → **Transcription**
3. Select **Groq** → Paste your API key where it says `Groq API Key`
4. Click the recording button (or press `Cmd+Shift+;` anywhere) and say "Testing Whispering"

**🎉 Success!** Your words are now in your clipboard. Paste anywhere!

---

### Common Issues

- **No transcription?** → Double-check API key in Settings
- **Shortcut not working?** → Bring Whispering to foreground (see macOS section below)
- **Wrong provider selected?** → Check Settings → Transcription

<details>
<summary><strong>macOS: Global shortcut stops working?</strong></summary>

This happens due to macOS App Nap, which suspends background apps to save battery.

**Quick fixes:**
1. Bring Whispering to the foreground briefly to restore shortcuts
2. Keep the app window open (even behind other windows)
3. Use our custom minimize mode (click the app's minimize button, not the OS one)

**Best practice:** Keep Whispering's window open behind other apps rather than minimizing it.

</details>

### 4️⃣ Next Steps: Power User Features

<details>
<summary><strong>🤖 AI-Powered Transformations</strong></summary>

Transform your transcriptions automatically with custom AI workflows:

**Quick Example - Auto-formatting:**
1. Go to **Transformations** (📚) in the top bar
2. Click "Create Transformation" → Name it "Format"
3. Add a **Prompt Transform** step:
   - Model: `Google Gemini 2.5 Flash` (or your preferred AI)
   - System prompt: `You are a professional text formatter.`
   - User prompt: `Format this transcription: {{input}}`
4. Save and select it in your recording settings

**What can transformations do?**
- Fix grammar and punctuation automatically
- Translate to other languages
- Convert casual speech to professional writing
- Create summaries or bullet points
- Remove filler words ("um", "uh")
- Chain multiple steps together

**Example workflow:** Speech → Transcribe → Fix Grammar → Translate to Spanish → Copy to clipboard

<details>
<summary>Setting up AI providers for transformations</summary>

You'll need additional API keys for AI transformations:
- **[Google Gemini](https://aistudio.google.com/app/apikey)** - Free tier available, fast
- **[OpenAI](https://platform.openai.com/api-keys)** - GPT-4 for complex tasks
- **[Anthropic](https://console.anthropic.com/settings/keys)** - Claude for nuanced writing
- **[Groq](https://console.groq.com/keys)** - Fast Llama models

</details>

</details>

<details>
<summary><strong>🎙️ Voice Activity Detection (VAD)</strong></summary>

Hands-free recording that starts when you speak and stops when you're done.

**Two ways to enable VAD:**

**Option 1: Quick toggle on homepage**
- On the homepage, click the **Voice Activated** tab (next to Manual)

**Option 2: Through settings**
1. Go to **Settings** → **Recording**
2. Find the **Recording Mode** dropdown
3. Select **Voice Activated** instead of Manual

**How it works:**
- Press shortcut once → VAD starts listening
- Speak → Recording begins automatically
- Stop speaking → Recording stops after a brief pause
- Your transcription appears instantly

Perfect for dictation without holding keys!

</details>

<details>
<summary><strong>⌨️ Custom Shortcuts</strong></summary>

Change the recording shortcut to whatever feels natural:

1. Go to **Settings** → **Recording**
2. Click on the shortcut field
3. Press your desired key combination
4. Popular choices: `F1`, `Cmd+Space+R`, `Ctrl+Shift+V`

</details>

## Configuration

### Transcription Services

Choose from these providers based on your needs:

#### 🚀 Groq (Recommended)
- **API Key:** [console.groq.com/keys](https://console.groq.com/keys)
- **Models:** `distil-whisper-large-v3-en` ($0.02/hr), `whisper-large-v3-turbo` ($0.04/hr), `whisper-large-v3` ($0.06/hr)
- **Why:** Fastest, cheapest, generous free tier

#### 🎯 OpenAI
- **API Key:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys) ([Enable billing](https://platform.openai.com/settings/organization/billing/overview))
- **Models:** `whisper-1` ($0.36/hr), `gpt-4o-transcribe` ($0.60/hr), `gpt-4o-mini-transcribe` ($0.18/hr)
- **Why:** Industry standard

#### 🎙️ ElevenLabs
- **API Key:** [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)
- **Models:** `scribe_v1`, `scribe_v1_experimental`
- **Why:** High-quality voice AI

#### 🏠 Speaches (Local)
- **API Key:** None needed!
- **Why:** Complete privacy, offline use, free forever

### Transformation Services (Optional)

For AI-powered post-processing of your transcriptions:

#### 🧠 OpenAI
- **API Key:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Models:** `gpt-4o`, `gpt-4o-mini`, `o3-mini` and more
- **Why:** Most capable, best for complex text transformations

#### 🤖 Anthropic
- **API Key:** [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- **Models:** `claude-opus-4-0`, `claude-sonnet-4-0`, `claude-3-7-sonnet-latest`
- **Why:** Excellent writing quality, nuanced understanding

#### ✨ Google Gemini
- **API Key:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Models:** `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`
- **Why:** Free tier available, fast response times

#### ⚡ Groq
- **API Key:** [console.groq.com/keys](https://console.groq.com/keys)
- **Models:** `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `gemma2-9b-it`, and more
- **Why:** Lightning fast inference, great for real-time transformations

### How is my data stored?

Whispering stores as much data as possible locally on your device, including recordings and text transcriptions. This approach ensures maximum privacy and data security. Here's an overview of how data is handled:

1. **Local Storage**: Voice recordings and transcriptions are stored in IndexedDB, which is used as blob storage and a place to store all of your data like text and transcriptions.

2. **Transcription Service**: The only data sent elsewhere is your recording to an external transcription service—if you choose one. You have the following options:
   - External services like OpenAI, Groq, or ElevenLabs (with your own API keys)
   - A local transcription service such as Speaches, which keeps everything on-device

3. **Transformation Service (Optional)**: Whispering includes configurable transformation settings that allow you to pipe transcription output into custom transformation flows. These flows can leverage:
   - External Large Language Models (LLMs) like OpenAI's GPT-4, Anthropic's Claude, Google's Gemini, or Groq's Llama models
   - Hosted LLMs within your custom workflows for advanced text processing
   - Simple find-and-replace operations for basic text modifications
   
   When using AI-powered transformations, your transcribed text is sent to your chosen LLM provider using your own API key. All transformation configurations, including prompts and step sequences, are stored locally in your settings.

You can change both the transcription and transformation services in the settings to ensure maximum local functionality and privacy.

## Development

### Built With Modern Web Technologies

Whispering showcases the power of modern web development as a comprehensive example application:

#### Web and Desktop
- [Svelte 5](https://svelte.dev): The UI reactivity library of choice with cutting-edge runes system
- [SvelteKit](https://kit.svelte.dev): For routing and static site generation
- [Tauri](https://tauri.app): The desktop app framework for native performance
- [Effect-TS](https://github.com/Effect-TS/effect): Type-safe functional programming
- [Svelte Sonner](https://svelte-sonner.vercel.app): Toast notifications for errors
- [TanStack Query](https://tanstack.com/query): Powerful data synchronization
- [TanStack Table](https://tanstack.com/table): Comprehensive data tables
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) & [Dexie.js](https://dexie.org): Local data storage
- [shadcn-svelte](https://www.shadcn-svelte.com): Beautiful, accessible components
- [TailwindCSS](https://tailwindcss.com): Utility-first CSS framework
- [Turborepo](https://turborepo.org): Monorepo management
- [Rust](https://www.rust-lang.org): Native desktop features
- [Vercel](https://vercel.com): Hosting platform
- [Zapsplat.com](https://www.zapsplat.com): Royalty-free sound effects

#### Browser Extension
- [React](https://reactjs.org): UI library
- [shadcn/ui](https://ui.shadcn.com): Component library
- [Chrome API](https://developer.chrome.com/docs/extensions/reference): Extension APIs

**Note:** The browser extension is temporarily disabled while we stabilize the desktop app.

#### Architecture Patterns
- Service Layer: Platform-agnostic business logic with Result types
- Query Layer: Reactive data management with caching
- RPC Pattern: Unified API interface (`rpc.recordings.getAllRecordings`)
- Dependency Injection: Clean separation of concerns

### Architecture Deep Dive

#### Three-Layer Architecture
```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  UI Layer   │ --> │  Query Layer│ --> │ Service Layer│
│ (Svelte 5)  │     │ (TanStack)  │     │   (Pure)     │
└─────────────┘     └─────────────┘     └──────────────┘
      ↑                    │
      └────────────────────┘
         Reactive Updates
```

#### Key Patterns

Service Layer (`/lib/services/`):
- Platform-agnostic business logic
- Result types for error handling
- Dependency injection for cross-platform support

Query Layer (`/lib/query/`):
- TanStack Query integration
- Reactive state management
- Caching and optimistic updates
- Unified RPC interface

RPC Pattern:
```typescript
import { rpc } from '$lib/query';

// Reactive usage in components
const recordings = createQuery(rpc.recordings.getAllRecordings.options);

// Imperative usage in actions
const { data, error } = await rpc.transcription.transcribe.execute(blob);
```

### Run Whispering in Local Development Mode

1. Clone the repository: `git clone https://github.com/braden-w/whispering.git`
2. Change into the project directory: `cd whispering`
3. Install the necessary dependencies: `pnpm i`

To run the desktop app and website:
```bash
cd apps/app
pnpm tauri dev
```


### Build The Executable Yourself

If you have concerns about the installers or want more control, you can build the executable yourself. This requires more setup, but it ensures that you are running the code you expect. Such is the beauty of open-source software!

#### Desktop

```bash
cd apps/app
pnpm i
pnpm tauri build
```

Find the executable in `apps/app/target/release`


### Contributing

We welcome contributions! Whispering is built in the open by developers who use it daily.

#### Code Style Guidelines
- Follow existing TypeScript and Svelte patterns
- Use Result types for error handling throughout
- Maintain service/query layer separation
- Add comprehensive JSDoc comments for public APIs
- Follow the existing architecture patterns (RPC, dependency injection, etc.)

#### Contributing Process
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them
4. Push to your fork: `git push origin your-branch-name`
5. Create a pull request

#### Good First Issues
- New transcription service integrations
- Additional transformation templates and AI integrations
- UI/UX improvements and accessibility enhancements
- Performance optimizations
- Documentation improvements
- Test coverage expansion

### Architecture for Learning

Whispering serves as a comprehensive example of modern web development:

#### What You'll Learn
- Svelte 5 Runes: Modern reactivity patterns
- Tauri Integration: Building desktop apps with web technologies
- Clean Architecture: Service/query layer separation
- Type Safety: Result types and comprehensive TypeScript usage
- State Management: TanStack Query patterns
- Local-First: IndexedDB integration and offline capabilities
- Cross-Platform: Platform-specific service implementations

#### Code Examples
The codebase includes detailed README files in key directories:
- `/lib/query/README.md` - Query layer patterns
- `/lib/services/README.md` - Service architecture
- `/lib/constants/README.md` - Constants organization
- Components follow shadcn-svelte patterns throughout

## Support and Community

### License

Whispering is released under the [MIT License](LICENSE). Use it, modify it, learn from it, and build upon it freely.

### Support and Feedback

If you encounter any issues or have suggestions for improvements, please open an issue on the [GitHub issues tab](https://github.com/braden-w/whispering/issues) or contact me via [whispering@bradenwong.com](mailto:whispering@bradenwong.com). I really appreciate your feedback!

- Issues and Bug Reports: [GitHub Issues](https://github.com/braden-w/whispering/issues)
- Feature Discussions: [GitHub Discussions](https://github.com/braden-w/whispering/discussions)
- Direct Contact: [whispering@bradenwong.com](mailto:whispering@bradenwong.com)

### Sponsors

This project is supported by amazing people and organizations:

<!-- sponsors --><a href="https://github.com/DavidGP"><img src="https://github.com/DavidGP.png" width="60px" alt="" /></a><a href="https://github.com/cgbur"><img src="https://github.com/cgbur.png" width="60px" alt="Chris Burgess" /></a><a href="https://github.com/Wstnn"><img src="https://github.com/Wstnn.png" width="60px" alt="" /></a><a href="https://github.com/rkhrkh"><img src="https://github.com/rkhrkh.png" width="60px" alt="" /></a><a href="https://github.com/doxgt"><img src="https://github.com/doxgt.png" width="60px" alt="" /></a><a href="https://github.com/worldoptimizer"><img src="https://github.com/worldoptimizer.png" width="60px" alt="Max Ziebell" /></a><a href="https://github.com/AlpSantoGlobalMomentumLLC"><img src="https://github.com/AlpSantoGlobalMomentumLLC.png" width="60px" alt="" /></a><!-- sponsors -->

---

Transcription should be free, open, and accessible to everyone. Join us in making it so.

Thank you for using Whispering and happy writing!