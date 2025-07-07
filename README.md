<p align="center">
  <a href="https://whispering.bradenwong.com">
    <img width="180" src="./apps/app/src-tauri/recorder-state-icons/studio_microphone.png" alt="Whispering">
  </a>
  <h1 align="center">Whispering</h1>
  <p align="center">Press shortcut → speak → get text. Free and open source ❤️</p>
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

Whispering is a voice-to-text app that turns your speech into text with a single keyboard shortcut. It works anywhere on your desktop—in any app, any text field—giving you instant transcription without switching windows or clicking buttons.

**Quick Links:** [Watch Overview (5 min)](#demo) | [Install (2 min)](#installation) | [Why I Built This](#why-whispering-exists) | [FAQ](#frequently-asked-questions) | [Architecture](#architecture-deep-dive)

Unlike subscription services that charge $15-30/month, Whispering lets you bring your own API key and pay providers directly—as little as $0.02/hour. Or go completely free with local transcription. Your audio, your choice, your data.

> **Note**: Whispering is designed for quick transcriptions, not long recordings. For extended recording sessions, use a dedicated recording app.

## Demo

<div align="center">
  <a href="https://www.youtube.com/watch?v=1jYgBMrfVZs">
    <img src="https://img.youtube.com/vi/1jYgBMrfVZs/maxresdefault.jpg" alt="Whispering Complete Setup Guide" width="600">
  </a>
  <p><em>Click to watch: Complete setup and usage guide (5 min)</em></p>
</div>

> **Want to see the voice coding workflow?** Check out this [3-minute demo](https://youtube.com/shorts/tP1fuFpJt7g) showing how I use Whispering with Claude Code for faster development.

## Features at a Glance

- **🎯 Multiple Transcription Providers** - Choose from Groq, OpenAI, ElevenLabs, or local options → [See providers](#-custom-transcription-services)
- **🤖 AI-Powered Transformations** - Automatically format, translate, or summarize your transcriptions → [Learn more](#-ai-powered-transformations)
- **🎙️ Voice Activity Detection** - Hands-free recording that starts when you speak
- **⌨️ Custom Shortcuts** - Set any keyboard combination for recording → [Customize shortcuts](#️-custom-shortcuts)
- **💾 Local-First Storage** - Your data stays on your device with IndexedDB → [Data privacy](#how-is-my-data-stored)
- **🏗️ Modern Architecture** - Clean, testable code with extensive documentation → [Architecture deep dive](#architecture-deep-dive)

## Installation

<!-- Download links are automatically updated by .github/workflows/update-readme-version.yml when new releases are published -->

**Get transcribing in 2 minutes** → Download, install, speak

### 1️⃣ Download Whispering

Choose your operating system below and click the download link:

<details>
<summary><strong>🍎 macOS</strong></summary>

#### Download Options

| Architecture | Download | Requirements |
|-------------|----------|--------------|
| **Apple Silicon** | [Whispering_7.0.0_aarch64.dmg](https://github.com/braden-w/whispering/releases/latest/download/Whispering_7.0.0_aarch64.dmg) | M1/M2/M3 Macs |
| **Intel** | [Whispering_7.0.0_x64.dmg](https://github.com/braden-w/whispering/releases/latest/download/Whispering_7.0.0_x64.dmg) | Intel-based Macs |

> **Not sure which Mac you have?** Click the Apple menu → About This Mac. Look for "Chip" or "Processor":
> - Apple M1/M2/M3 → Use Apple Silicon version
> - Intel Core → Use Intel version

#### Installation steps:
1. Download the `.dmg` file for your architecture
2. Open the downloaded file
3. Drag Whispering to your Applications folder
4. Open Whispering from Applications

### Troubleshooting:
- **"Unverified developer" warning:** Right-click the app → Open → Open
- **"App is damaged" error (Apple Silicon):** Run `xattr -cr /Applications/Whispering.app` in Terminal

</details>

<details>
<summary><strong>🪟 Windows</strong></summary>

#### Download Options

| Installer Type | Download | Description |
|---------------|----------|-------------|
| **MSI Installer** | [Whispering_7.0.0_x64_en-US.msi](https://github.com/braden-w/whispering/releases/latest/download/Whispering_7.0.0_x64_en-US.msi) | Recommended - Standard Windows installer |
| **EXE Installer** | [Whispering_7.0.0_x64-setup.exe](https://github.com/braden-w/whispering/releases/latest/download/Whispering_7.0.0_x64-setup.exe) | Alternative installer option |

#### Installation

1. Download the `.msi` installer (recommended)
2. Double-click to run the installer
3. If Windows Defender appears: Click "More Info" → "Run Anyway"
4. Follow the installation wizard

Whispering will appear in your Start Menu when complete.

</details>

<details>
<summary><strong>🐧 Linux</strong></summary>

#### Download Options

| Package Format | Download | Compatible With |
|---------------|----------|-----------------|
| **AppImage** | [Whispering_7.0.0_amd64.AppImage](https://github.com/braden-w/whispering/releases/latest/download/Whispering_7.0.0_amd64.AppImage) | All Linux distributions |
| **DEB Package** | [Whispering_7.0.0_amd64.deb](https://github.com/braden-w/whispering/releases/latest/download/Whispering_7.0.0_amd64.deb) | Debian, Ubuntu, Pop!_OS |
| **RPM Package** | [Whispering-7.0.0-1.x86_64.rpm](https://github.com/braden-w/whispering/releases/latest/download/Whispering-7.0.0-1.x86_64.rpm) | Fedora, RHEL, openSUSE |

#### Quick Install Commands

**AppImage** (Universal)
```bash
wget https://github.com/braden-w/whispering/releases/latest/download/Whispering_7.0.0_amd64.AppImage
chmod +x Whispering_7.0.0_amd64.AppImage
./Whispering_7.0.0_amd64.AppImage
```

**Debian/Ubuntu**
```bash
wget https://github.com/braden-w/whispering/releases/latest/download/Whispering_7.0.0_amd64.deb
sudo dpkg -i Whispering_7.0.0_amd64.deb
```

**Fedora/RHEL**
```bash
wget https://github.com/braden-w/whispering/releases/latest/download/Whispering-7.0.0-1.x86_64.rpm
sudo rpm -i Whispering-7.0.0-1.x86_64.rpm
```

</details>

> **Links not working?** Find all downloads at [GitHub Releases](https://github.com/braden-w/whispering/releases/latest)

<details>
<summary><strong>Try in Browser (No Download)</strong></summary>

<br>

**[🚀 Open Whispering Web App →](https://whispering.bradenwong.com)**

No installation needed! Works in any modern browser.

> **Note:** The web version doesn't have global keyboard shortcuts, but otherwise works great for trying out Whispering before installing.

</details>

### 2️⃣ Get Your API Key (30 seconds)

Right now, I personally use **Groq** for almost all my transcriptions.

> 💡 **Why Groq?** The fastest models, super accurate, generous free tier, and unbeatable price (as cheap as $0.02/hour using `distil-whisper-large-v3-en`)

1. Visit [console.groq.com/keys](https://console.groq.com/keys)
2. Sign up → Create API key → Copy it

**🙌 That's it!** No credit card required for the free tier. You can start transcribing immediately.

### 3️⃣ Connect & Test

1. Open Whispering
2. Click **Settings** (⚙️) → **Transcription**
3. Select **Groq** → Paste your API key where it says `Groq API Key`
4. Click the recording button (or press `Cmd+Shift+;` anywhere) and say "Testing Whispering"

**🎉 Success!** Your words are now in your clipboard. Paste anywhere!

<details>
<summary><strong>Having trouble? Common issues & fixes</strong></summary>

### Quick Fixes
- **No transcription?** → Double-check API key in Settings
- **Shortcut not working?** → Bring Whispering to foreground (see macOS section below)
- **Wrong provider selected?** → Check Settings → Transcription

### Platform-Specific Issues

<details>
<summary><strong>macOS: Global shortcut stops working?</strong></summary>

This happens due to macOS App Nap, which suspends background apps to save battery.

**Quick fixes:**
1. Use Voice Activated mode for hands-free operation (recommended)
2. Bring Whispering to the foreground briefly to restore shortcuts
3. Keep the app window in the foreground (even as a smaller window)

**Best practice:** Keep Whispering in the foreground in front of other apps. You can resize it to a smaller window or use Voice Activated mode for minimal disruption.

</details>

<details>
<summary><strong>Accidentally rejected microphone permissions?</strong></summary>

If you accidentally clicked "Don't Allow" when Whispering asked for microphone access, here's how to fix it:

#### 🍎 macOS
1. Open **System Settings** → **Privacy & Security** → **Privacy** → **Microphone**
2. Find **Whispering** in the list
3. Toggle the switch to enable microphone access
4. If Whispering isn't in the list, reinstall the app to trigger the permission prompt again

#### 🪟 Windows
If you accidentally blocked microphone permissions, use the Registry solution:

**Registry Cleanup (Recommended)**
1. Close Whispering
2. Open Registry Editor (Win+R, type `regedit`)
3. Use Find (Ctrl+F) to search for "Whispering"
4. Delete all registry folders containing "Whispering"
5. Press F3 to find next, repeat until all instances are removed
6. Uninstall and reinstall Whispering
7. Accept permissions when prompted

<details>
<summary>Alternative solutions</summary>

**Delete App Data:** Navigate to `%APPDATA%\..\Local\com.bradenwong.whispering` and delete this folder, then reinstall.

**Windows Settings:** Settings → Privacy & security → Microphone → Enable "Let desktop apps access your microphone"

</details>

See [Issue #526](https://github.com/braden-w/whispering/issues/526) for more details.

</details>

</details>

### 4️⃣ Next Steps: Power User Features

Take your transcription experience to the next level with these advanced features:

<details>
<summary><strong>🎯 Custom Transcription Services</strong></summary>

Choose from multiple transcription providers based on your needs for speed, accuracy, and privacy:

#### 🚀 Groq (Recommended)
- **API Key:** [console.groq.com/keys](https://console.groq.com/keys)
- **Models:** `distil-whisper-large-v3-en` ($0.02/hr), `whisper-large-v3-turbo` ($0.04/hr), `whisper-large-v3` ($0.06/hr)
- **Why:** Fastest, cheapest, generous free tier

#### 🎯 OpenAI
- **API Key:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys) ([Enable billing](https://platform.openai.com/settings/organization/billing/overview))
- **Models:** `whisper-1` ($0.36/hr), `gpt-4o-transcribe` ($0.36/hr), `gpt-4o-mini-transcribe` ($0.18/hr)
- **Why:** Industry standard

#### 🎙️ ElevenLabs
- **API Key:** [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)
- **Models:** `scribe_v1`, `scribe_v1_experimental`
- **Why:** High-quality voice AI

#### 🏠 Speaches (Local)
- **API Key:** None needed!
- **Why:** Complete privacy, offline use, free forever

</details>

<details>
<summary><strong>🤖 AI-Powered Transformations</strong></summary>

Transform your transcriptions automatically with custom AI workflows:

**Quick Example - Format Text:**
1. Go to **Transformations** (📚) in the top bar
2. Click "Create Transformation" → Name it "Format Text"
3. Add a **Prompt Transform** step:
   - Model: `Claude Sonnet 3.5` (or your preferred AI)
   - System prompt: `You are an intelligent text formatter specializing in cleaning up transcribed speech. Your task is to transform raw transcribed text into well-formatted, readable content while maintaining the speaker's original intent and voice.

Core Principles:

1. Preserve authenticity - Keep the original wording and phrasing as much as possible
2. Add clarity - Make intelligent corrections only where needed for comprehension
3. Enhance readability - Apply proper formatting, punctuation, and structure

Formatting Guidelines:

Punctuation & Grammar:
- Add appropriate punctuation (periods, commas, question marks)
- Correct obvious transcription errors while preserving speaking style
- Fix run-on sentences by adding natural breaks
- Maintain conversational tone and personal speaking patterns

Structure & Organization:
- Create paragraph breaks at natural topic transitions
- Use bullet points or numbered lists when the speaker is listing items
- Add headings if the content has clear sections
- Preserve emphasis through italics or bold when the speaker stresses words

Intelligent Corrections:
- Fix homophones (e.g., "there/their/they're")
- Complete interrupted thoughts when the intention is clear
- Remove excessive filler words (um, uh) unless they add meaning
- Correct obvious misspeaks while noting significant ones in [brackets]

Special Handling:
- Technical terms: Research and correct spelling if unclear
- Names/places: Make best guess and mark uncertain ones with [?]
- Numbers: Convert spoken numbers to digits when appropriate
- Time references: Standardize format (e.g., "3 PM" not "three in the afternoon")

Preserve Original Intent:
- Keep colloquialisms and regional expressions
- Maintain the speaker's level of formality
- Don't "upgrade" simple language to sound more sophisticated
- Preserve humor, sarcasm, and emotional tone

Output Format:
Return the formatted text with:
- Clear paragraph breaks
- Proper punctuation and capitalization
- Any structural elements (lists, headings) that improve clarity
- [Bracketed notes] for unclear sections or editorial decisions
- Original meaning and voice intact

Remember: You're a translator from spoken to written form, not an editor trying to improve the content. Make it readable while keeping it real.`
   - User prompt: `Here is the text to format:

<text>{{input}}</text>`
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

You'll need additional API keys for AI transformations. Choose from these providers based on your needs:

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

## Why Whispering Exists

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

## How is my data stored?

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

## Frequently Asked Questions

### How is Whispering different from other transcription apps?

The main difference is philosophy. Whispering is 100% free and open source. You bring your own API key, so you pay cents directly to providers instead of monthly subscriptions. Your data never touches our servers—it goes straight from your device to your chosen transcription service (or stays completely local).

### What's the catch?

No catch. I built this for myself and use it daily. I believe essential tools should be free and transparent. The code is open source so you can verify everything yourself. There's no telemetry, no data collection, and no premium tiers. It's just a tool that does one thing well.

### What's the technical stack?

Built with Svelte 5 (using new runes) + Tauri for native performance. Lightweight bundle (~22MB on macOS), instant startup, low memory usage. The codebase showcases modern patterns and is great for learning. For a deep dive into the architecture, see the [Architecture section](#architecture-deep-dive).

### Can I use this offline?

Yes! Choose the Speaches provider for completely local transcription. No internet required, no API keys, and your audio never leaves your device.

### How much does it cost to use?

With your own API key:
- Groq: $0.02-$0.06/hour
- OpenAI: $0.18-$0.36/hour  
- Local (Speaches): Free forever

Compare that to subscription services charging $15-30/month!

### Is my data private?

Yes. Whispering stores recordings locally in IndexedDB. When using external transcription services, your audio goes directly to them using your API key—there's no middleman server. For maximum privacy, use the local Speaches provider.

### Can I customize the transcription output?

Absolutely! Use AI-powered transformations to automatically format, translate, or summarize your transcriptions. See [AI-Powered Transformations](#-ai-powered-transformations) for details.

### What platforms are supported?

Desktop: macOS (Intel & Apple Silicon), Windows, Linux  
Web: Any modern browser at [whispering.bradenwong.com](https://whispering.bradenwong.com)

### I found a bug or have a feature request

Please open an issue on [GitHub](https://github.com/braden-w/whispering/issues) or join our [Discord](https://discord.gg/YWa5YVUSxa). I actively maintain this project and love hearing from users!

## Development

### Built With Modern Web Technologies

Whispering showcases the power of modern web development as a comprehensive example application:

#### Web and Desktop
- [Svelte 5](https://svelte.dev): The UI reactivity library of choice with cutting-edge runes system
- [SvelteKit](https://kit.svelte.dev): For routing and static site generation
- [Tauri](https://tauri.app): The desktop app framework for native performance
- [WellCrafted](https://github.com/wellcrafted-dev/wellcrafted): Lightweight type-safe error handling
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

Whispering uses a clean three-layer architecture that achieves **extensive code sharing** between the desktop app (Tauri) and web app. This is possible because of how we handle platform differences and separate business logic from UI concerns.

**Quick Navigation:** [Service Layer](#service-layer---pure-business-logic--platform-abstraction) | [Query Layer](#query-layer---adding-reactivity-and-state-management) | [Error Handling](#error-handling-with-wellcrafted)

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  UI Layer   │ --> │  Query Layer│ --> │ Service Layer│
│ (Svelte 5)  │     │ (TanStack)  │     │   (Pure)     │
└─────────────┘     └─────────────┘     └──────────────┘
      ↑                    │
      └────────────────────┘
         Reactive Updates
```

#### Service Layer - Pure Business Logic + Platform Abstraction

The service layer contains all business logic as **pure functions** with zero UI dependencies. Services don't know about reactive Svelte variables, user settings, or UI state—they only accept explicit parameters and return `Result<T, E>` types for consistent error handling.

The key innovation is **build-time platform detection**. Services automatically choose the right implementation based on the target platform:

```typescript
// Platform abstraction happens at build time
export const ClipboardServiceLive = window.__TAURI_INTERNALS__
  ? createClipboardServiceDesktop() // Uses Tauri clipboard APIs
  : createClipboardServiceWeb();     // Uses browser clipboard APIs

// Same interface, different implementations
export const NotificationServiceLive = window.__TAURI_INTERNALS__
  ? createNotificationServiceDesktop() // Native OS notifications
  : createNotificationServiceWeb();     // Browser notifications
```

This design enables **extensive code sharing** between desktop and web versions. The vast majority of the application logic is platform-agnostic, with only the thin service implementation layer varying between platforms. Services are incredibly **testable** (just pass mock parameters), **reusable** (work identically anywhere), and **maintainable** (no hidden dependencies). 

**→ Learn more:** [Services README](./apps/app/src/lib/services/README.md) | [Constants Organization](./apps/app/src/lib/constants/README.md)

#### Query Layer - Adding Reactivity and State Management

The query layer is where reactivity gets injected on top of pure services. It wraps service functions with TanStack Query and handles two key responsibilities:

**Runtime Dependency Injection** - Dynamically switching service implementations based on user settings:

```typescript
// From transcription query layer
async function transcribeBlob(blob: Blob) {
  const selectedService = settings.value['transcription.selectedTranscriptionService'];

  switch (selectedService) {
    case 'OpenAI':
      return services.transcriptions.openai.transcribe(blob, {
        apiKey: settings.value['apiKeys.openai'],
        model: settings.value['transcription.openai.model'],
      });
    case 'Groq':
      return services.transcriptions.groq.transcribe(blob, {
        apiKey: settings.value['apiKeys.groq'], 
        model: settings.value['transcription.groq.model'],
      });
  }
}
```

**Optimistic Updates** - Using the TanStack Query client to manipulate the cache for optimistic UI. By updating the cache, reactivity automatically kicks in and the UI reflects these changes, giving you instant optimistic updates.

It's often unclear where exactly you should mutate the cache with the query client—sometimes at the component level, sometimes elsewhere. By having this dedicated query layer, it becomes very clear: we co-locate three key things in one place: (1) the service call, (2) runtime settings injection based on reactive variables, and (3) cache manipulation (also reactive). This creates a layer that bridges reactivity with services in an intuitive way. It also cleans up our components significantly because we have a consistent place to put this logic—now developers know that all cache manipulation lives in the query folder, making it clear where to find and add this type of functionality:

```typescript
// From recordings mutations
createRecording: defineMutation({
  resultMutationFn: async (recording: Recording) => {
    const { data, error } = await services.db.createRecording(recording);
    if (error) return Err(error);

    // Optimistically update cache - UI updates instantly
    queryClient.setQueryData(['recordings'], (oldData) => {
      if (!oldData) return [recording];
      return [...oldData, recording];
    });

    return Ok(data);
  },
})
```

This design keeps all reactive state management isolated in the query layer, allowing services to remain pure and platform-agnostic while the UI gets dynamic behavior and instant updates. 

**→ Learn more:** [Query README](./apps/app/src/lib/query/README.md) | [RPC Pattern Guide](./apps/app/src/lib/query/README.md#rpc-pattern)

#### Error Transformation

The query layer also transforms service-specific errors into `WhisperingError` types that integrate seamlessly with the toast notification system. This happens inside `resultMutationFn` or `resultQueryFn`, creating a clean boundary between business logic errors and UI presentation:

```typescript
// Service returns domain-specific error
const { data, error: serviceError } = await services.manualRecorder.startRecording(...);

if (serviceError) {
  // Query layer transforms to UI-friendly WhisperingError
  return Err(WhisperingError({
    title: '❌ Failed to start recording',
    description: serviceError.message,  // Preserve detailed message
    action: { type: 'more-details', error: serviceError }
  }));
}
```

#### Error Handling with WellCrafted

Whispering uses [WellCrafted](https://github.com/wellcrafted-dev/wellcrafted), a lightweight TypeScript library I created to bring Rust-inspired error handling to JavaScript. I built WellCrafted after using the [effect-ts library](https://github.com/Effect-TS/effect) when it first came out in 2023—I was very excited about the concepts but found it too verbose. WellCrafted distills my takeaways from effect-ts and makes them better by leaning into more native JavaScript syntax, making it perfect for this use case. Unlike traditional try-catch blocks that hide errors, WellCrafted makes all potential failures explicit in function signatures using the `Result<T, E>` pattern.

**Key benefits in Whispering:**
- **Explicit errors**: Every function that can fail returns `Result<T, E>`, making errors impossible to ignore
- **Type safety**: TypeScript knows exactly what errors each function can produce
- **Serialization-safe**: Errors are plain objects that survive JSON serialization (critical for Tauri IPC)
- **Rich context**: Structured `TaggedError` objects include error names, messages, context, and causes
- **Zero overhead**: ~50 lines of code, < 2KB minified, no dependencies

This approach ensures robust error handling across the entire codebase, from service layer functions to UI components, while maintaining excellent developer experience with TypeScript's control flow analysis.

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

We welcome contributions! Whispering is built with care and attention to clean, maintainable code.

#### Code Style Guidelines
- Follow existing TypeScript and Svelte patterns throughout
- Use Result types from the [WellCrafted library](https://github.com/wellcrafted-dev/wellcrafted) for all error handling
- Follow WellCrafted best practices: explicit errors with `Result<T, E>`, structured `TaggedError` objects, and comprehensive error context
- Study the existing patterns in these key directories:
  - **[Services Architecture](./apps/app/src/lib/services/README.md)** - Platform-agnostic business logic
  - **[Query Layer Patterns](./apps/app/src/lib/query/README.md)** - RPC pattern and reactive state  
  - **[Constants Organization](./apps/app/src/lib/constants/README.md)** - Type-safe configuration
  
**→ New to the codebase?** Start with the [Architecture Deep Dive](#architecture-deep-dive) to understand how everything fits together.

Note: WellCrafted is a TypeScript utility library I created to bring Rust-inspired error handling to JavaScript. It makes errors explicit in function signatures and ensures robust error handling throughout the codebase.

#### Contributing Process
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them
4. Push to your fork: `git push origin your-branch-name`
5. Create a pull request

#### Version Bumping
When preparing a new release, use our version bumping script to update all necessary files:

```bash
# Update version across all project files
bun run bump-version <new-version>

# Example:
bun run bump-version 7.0.1
```

This script automatically updates:
- Root `package.json`
- App `package.json`
- Tauri configuration (`tauri.conf.json`)
- Cargo manifest (`Cargo.toml`)

After running the script, follow the displayed instructions to commit, tag, and push the changes.

#### Good First Issues
- UI/UX improvements and accessibility enhancements
- Performance optimizations
- New transcription or transformation service integrations

Feel free to suggest and implement any features that improve usability—I'll do my best to integrate contributions that make Whispering better for everyone.

## Support and Community

### License

Whispering is released under the [MIT License](LICENSE). Use it, modify it, learn from it, and build upon it freely.

### Support and Feedback

If you encounter any issues or have suggestions for improvements, please open an issue on the [GitHub issues tab](https://github.com/braden-w/whispering/issues) or contact me via [whispering@bradenwong.com](mailto:whispering@bradenwong.com). I really appreciate your feedback!

- Community Chat: [Discord](https://discord.gg/YWa5YVUSxa)
- Issues and Bug Reports: [GitHub Issues](https://github.com/braden-w/whispering/issues)
- Feature Discussions: [GitHub Discussions](https://github.com/braden-w/whispering/discussions)
- Direct Contact: [whispering@bradenwong.com](mailto:whispering@bradenwong.com)

### Sponsors

This project is supported by amazing people and organizations:

<!-- sponsors --><a href="https://github.com/DavidGP"><img src="https://github.com/DavidGP.png" width="60px" alt="" /></a><a href="https://github.com/cgbur"><img src="https://github.com/cgbur.png" width="60px" alt="Chris Burgess" /></a><a href="https://github.com/Wstnn"><img src="https://github.com/Wstnn.png" width="60px" alt="" /></a><a href="https://github.com/rkhrkh"><img src="https://github.com/rkhrkh.png" width="60px" alt="" /></a><a href="https://github.com/doxgt"><img src="https://github.com/doxgt.png" width="60px" alt="" /></a><a href="https://github.com/worldoptimizer"><img src="https://github.com/worldoptimizer.png" width="60px" alt="Max Ziebell" /></a><a href="https://github.com/AlpSantoGlobalMomentumLLC"><img src="https://github.com/AlpSantoGlobalMomentumLLC.png" width="60px" alt="" /></a><!-- sponsors -->

---

Transcription should be free, open, and accessible to everyone. Join us in making it so.

Thank you for using Whispering and happy writing!