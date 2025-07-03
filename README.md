<p align="center">
  <a href="https://whispering.bradenwong.com">
    <img width="180" src="./apps/app/src-tauri/recorder-state-icons/studio_microphone.png" alt="Whispering">
  </a>
  <h1 align="center">Whispering</h1>
  <p align="center">Fully open source transcription</p>
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

Press a shortcut anywhere on your desktop → speak → get text (or AI-transformed text) in your clipboard. That's it.

Whispering is the transcription app I built because I got tired of paying monthly subscriptions for something that should cost pennies. It's completely open source, works across platforms, and you control everything—your data, your API keys, your privacy.

Bring your own API key from providers like OpenAI, Groq, or ElevenLabs, and pay only cents per hour instead of monthly subscriptions. Or use a local transcription service like `Speaches`, which keeps everything on-device. Your audio goes directly to your chosen service—no middleman, no tracking, no data collection.


> We believe transcription should be accessible to everyone. Essential productivity tools shouldn't be locked behind paywalls or closed source code. With Whispering, you own your data, you audit the code, and you control your privacy.

## Why Choose Whispering?

### Cost Comparison

| Service | Cost per Hour | Monthly (1 hr/day) | Traditional Tools |
|---------|---------------|-------------------|------------------|
| `distil-whisper-large-v3-en` (Groq) | $0.02 | $0.60 | $15-30/month |
| `whisper-large-v3-turbo` (Groq) | $0.04 | $1.20 | $15-30/month |
| `gpt-4o-mini-transcribe` (OpenAI) | $0.18 | $5.40 | $15-30/month |
| Local (Speaches) | $0.00 | $0.00 | $15-30/month |

*Instead of paying $15-30/month for transcription subscriptions, you pay providers directly. No subscriptions, no markup, no middleman.*

### Because You're Tired of the Usual SaaS Problems

**The pricing is nuts.** Most transcription services charge $15-30/month for what should cost at most $2. You're not paying for the transcription—you're paying for their profit margin.

**Nobody knows where your voice recordings go.** Your voice recordings get uploaded to someone else's servers, processed by their systems, and stored according to their privacy policy. You have no idea what happens to your data.

**You're stuck with whatever they give you.** Most services use OpenAI's Whisper behind the scenes anyway, but you can't switch providers, can't use faster models, and can't go local when you need privacy.

**Things just disappear.** Companies pivot, get acquired, or shut down. Then you're stuck migrating your workflows and retraining your muscle memory.

With Whispering, you actually control what matters:
- **Your API keys** - Switch providers in 30 seconds, compare costs, use multiple services
- **Your data** - Audio never touches our servers, transcriptions stored locally on your device
- **Your privacy** - Go completely local with Speaches, or use cloud services directly
- **Your workflow** - Open source means it works as long as you want it to work
- **Your costs** - Pay providers directly at actual cost, not marked-up subscription prices

## Key Concepts

Before diving in, here are the essential terms that will make everything clearer:

**📋 Transcription**: Converting speech (audio) into written text  
**🔌 API Key**: A secure password that lets Whispering access transcription services  
**🏢 Provider**: Companies offering transcription services (like OpenAI, Groq, ElevenLabs)  
**🤖 Model**: Different AI versions with speed/accuracy trade-offs (like "fast but good" vs "slow but perfect")  
**🔄 Transformation**: Automatic improvements to your transcription (fixing grammar, formatting, etc.)  
**🌐 Global Shortcut**: Keyboard combination that works anywhere on your computer  

## Demo Videos

https://github.com/user-attachments/assets/eca93701-10a0-4d91-b38a-f715bd7e0357

https://github.com/user-attachments/assets/a7934f1f-d08b-4037-9bbc-aadd1b13501e

## Getting Started

### What You'll Need

**Transcription Service**: Whispering converts your speech to text using transcription services. You have two options:

- **Cloud services** (OpenAI, Groq, ElevenLabs) - Require an API key but often offers better accuracy, performance, and convenience
- **Local transcription** (Speaches) - Runs on your device, no API key needed, completely private

**API Key**: If using cloud services, you'll need an API key (think of it as a secure password that lets Whispering access the service on your behalf). You pay the service directly (usually cents per hour), not us.

**Recommended for beginners**: Start with [Groq](https://console.groq.com/keys)'s `distil-whisper-large-v3-en` or `whisper-large-v3-turbo`—they're the fastest and cheapest options at $0.02/hour and $0.04/hour with great accuracy.

### Download & Install

Choose your platform and download:

**macOS**: [Apple Silicon](https://github.com/braden-w/whispering/releases/latest) | [Intel](https://github.com/braden-w/whispering/releases/latest)
- Download the `.dmg` file, drag to Applications
- If you see "unverified developer", right-click and select "Open"
- Apple Silicon users: If you get a "damaged" error, run: `xattr -cr /Applications/Whispering.app`

**Windows**: [64-bit Installer](https://github.com/braden-w/whispering/releases/latest)
- Download the `.msi` installer and run it
- Click "More Info" → "Run Anyway" if prompted

**Linux**: [AppImage](https://github.com/braden-w/whispering/releases/latest) | [DEB](https://github.com/braden-w/whispering/releases/latest)
- AppImage: `chmod +x whispering_x.x.x_amd64.AppImage && ./whispering_x.x.x_amd64.AppImage`
- DEB: `sudo dpkg -i whispering_x.x.x_amd64.deb`

**Web App**: Visit [whispering.bradenwong.com](https://whispering.bradenwong.com) for the browser version.

**Chrome Extension**: Currently temporarily disabled while we stabilize recent changes.

### Set Up Transcription

1. Open Whispering and navigate to **Settings** (⚙️) → **Transcription**
2. **Choose your service.** Here are my personal recommendations:
   - **Groq** (Recommended): Fastest, cheapest, with great accuracy
   - **OpenAI**: Industry standard, slightly more expensive
   - **ElevenLabs**: High accuracy, most expensive
   - **Speaches**: Local transcription, completely private, no API key needed
3. **Configure your service:**
   - **For cloud services (Groq, OpenAI, ElevenLabs)**: Get an API key from your chosen provider and paste it into the API key field
   - **For Speaches**: Configure the base URL (typically `http://localhost:8000`) and model ID after setting up your local server
   - **Groq example**: Get a key at [console.groq.com/keys](https://console.groq.com/keys) and select "distil-whisper-large-v3-en" model for best speed/cost balance

### Start Using Whispering

**Global shortcut**: Press `Ctrl/Cmd + Shift + ;` anywhere on your desktop to start recording

**In-app**: Click the large microphone button in the main interface

**Hands-free**: Enable Voice Activity Detection (VAD) in settings for automatic recording

Your transcription will be automatically copied to your clipboard and ready to paste anywhere!

That's it. We don't charge you (only your API provider does). No credit card. No subscription. No tracking.

### Known Issues

#### macOS Global Shortcut Limitations

On macOS, global shortcuts may occasionally stop responding when the app runs in the background due to macOS's App Nap feature, which reduces background app performance to save battery.

**Solution:** Bring Whispering to the foreground briefly to restore shortcut functionality. You can also run Whispering in the foreground using our custom minimize mode by clicking the minimize button (not the OS minimize button).

### Optional: Advanced Features

Once you're comfortable with basic transcription, explore these powerful features:

#### AI-Powered Transformations
Enhance your transcriptions with custom workflows by creating transformation pipelines:

**Creating a Transformation Workflow:**
1. Navigate to **Transformations** (📚) in the top bar main navigation
2. Click "Create Transformation" 
3. Give your workflow a title (e.g., "Format")

**Configuring Prompt Transform:**
1. Add a new step and select **"Prompt Transform"**
2. Choose your AI model profile (e.g., **"Google Gemini 2.5 Flash"**)
3. Configure your prompts using dynamic injection:

   **System Prompt Example:**
   ```
   You are a professional text formatter. Format the following transcribed text for clarity and readability.
   ```

   **User Prompt Example:**
   ```
   Please format this transcription: {{input}}
   
   Requirements:
   - Fix capitalization and punctuation
   - Break into logical paragraphs
   - Maintain original meaning
   ```

**How It Works:**
- The `{{input}}` placeholder receives your transcribed text
- When the workflow runs, `{{input}}` is replaced with the actual transcription
- The AI processes your text and returns the formatted result

**Chaining Multiple Steps:**
Create complex workflows by adding more transformation steps:
- **Step 1:** Prompt Transform (Format with Gemini 2.5 Flash)
- **Step 2:** Find & Replace (Remove filler words like "um", "uh")  
- **Step 3:** Prompt Transform (Translate to Spanish with GPT-4)

Each step receives the output from the previous step as its `{{input}}`.

**Note:** Additional AI provider API keys may be needed ([see API Key Providers](#api-key-providers))

## Key Features

1. Global Transcription: Access speech-to-text functionality anywhere with a global keyboard shortcut or within two button clicks. Works across all applications on desktop.

2. Cross-Platform Experience:
   - Desktop App: Enables global transcription across all applications with customizable shortcuts
   - Web App: Full-featured transcription interface accessible from any browser
   - Browser Extension: Provides global transcription in Chrome by communicating with the web app (temporarily disabled)

3. Multiple Recording Modes:
   - Manual: Click to start/stop recording with full control
   - Voice Activity Detection (VAD): Hands-free recording with automatic speech detection and silence trimming

4. Multi-Provider Transcription:
   - OpenAI Whisper: Industry-standard accuracy with multiple model options (`whisper-1`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`)
   - Groq: Lightning-fast transcription with cost efficiency (`whisper-large-v3`, `whisper-large-v3-turbo`, `distil-whisper-large-v3-en`)
   - ElevenLabs: High-quality transcription service (`scribe_v1`, `scribe_v1_experimental`)
   - Speaches: Local transcription for complete privacy and offline functionality

5. Transformation Pipeline: Post-process transcriptions with AI-powered transformations including grammar correction, formatting, translation, and custom templates. Chain multiple transformations together.

6. Transcription Management: Review, edit, and organize all transcriptions within the app. Export to multiple formats with comprehensive search and filtering.

7. Automatic Clipboard Integration: Transcribed text is automatically copied to clipboard with optional automatic pasting (configurable in settings).

> Important Note: Whispering is designed primarily as a transcription tool, not a recording tool. For longer recordings where reliability is crucial, we recommend using a dedicated recording app that utilizes native recording APIs for optimal audio quality and stability.



## Configuration

### API Key Providers

Get an API key from any of these supported services:

#### Transcription Services
- **[Groq](https://console.groq.com/keys)** - Fastest & cheapest transcription
- **[OpenAI](https://platform.openai.com/api-keys)** - Industry-standard Whisper models ([Enable billing](https://platform.openai.com/settings/organization/billing/overview))
- **[ElevenLabs](https://elevenlabs.io/app/settings/api-keys)** - High-quality voice AI transcription
- **Local** - Use Speaches for complete privacy (no API key needed)

#### Transformation Services (Optional)
For AI-powered post-processing of your transcriptions:
- **[OpenAI](https://platform.openai.com/api-keys)** - GPT-4 and GPT-3.5 for advanced text processing
- **[Anthropic](https://console.anthropic.com/settings/keys)** - Claude models for intelligent transformations
- **[Google](https://aistudio.google.com/app/apikey)** - Gemini models for creative text enhancement
- **[Groq](https://console.groq.com/keys)** - Fast Llama models for quick transformations

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
- [Plasmo](https://docs.plasmo.com): Chrome extension framework
- [React](https://reactjs.org): UI library (Plasmo requirement)
- [shadcn/ui](https://ui.shadcn.com): Component library
- [Chrome API](https://developer.chrome.com/docs/extensions/reference): Extension APIs

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

To run the Chrome extension (once it's restored):
```bash
cd apps/extension
pnpm dev --target=chrome-mv3
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

#### Firefox Extension
```bash
cd apps/extension
pnpm i
pnpm plasmo build --target=firefox-mv3
```
Output in `apps/extension/build/firefox-mv3-prod`

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
- Browser extension features (when re-enabled)

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