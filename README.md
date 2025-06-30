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

## About

Whispering is a fully free and open source transcription app. While other apps charge monthly subscriptions, we believe transcription should be accessible to everyone.

Bring your own API key from providers like OpenAI, Groq, or ElevenLabs, and pay only cents per hour instead of monthly subscriptions. Or use a local transcription service like `Speaches`, which keeps everything on-device. Your audio goes directly to your chosen service—no middleman, no tracking, no data collection.

Transcription is an essential tool that should be accessible to everyone. Essential productivity tools shouldn't be locked behind paywalls or closed source code. With Whispering, you own your data, you audit the code, and you control your privacy.

### Quick Start
1. **Download** the app for your platform
2. **Add your API key** (OpenAI, Groq, or others) or **configure your local transcription server**
3. **Press** `Ctrl/Cmd + Shift + ;` to transcribe anywhere (and configure more in settings)

That's it. We don't charge you (only your API provider does).

No credit card. No subscription. No tracking.

## Why Whispering Wins

### 💰 Actual Cost Comparison
| Your Usage | Whispering | Competitors |
|------------|------------|-------------|
| Light (10 min/day) | ~$0.30/month | $5-15/month |
| Regular (30 min/day) | ~$0.90/month | $12-24/month |
| Heavy (2 hrs/day) | ~$3.60/month | $24-30/month |

*Based on typical API pricing. You pay your provider directly.*

### 🔒 Your Data, Your Control
- **Direct API connections** - Your audio never touches our servers
- **Local storage** - All recordings stay on your device
- **Open source** - Audit the code yourself
- **No telemetry** - We don't even know you're using it

## Demo Videos

https://github.com/user-attachments/assets/eca93701-10a0-4d91-b38a-f715bd7e0357

https://github.com/user-attachments/assets/a7934f1f-d08b-4037-9bbc-aadd1b13501e

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

## How is my data stored?

Whispering stores as much data as possible locally on your device, including recordings and text transcriptions. This approach ensures maximum privacy and data security. Here's an overview of how data is handled:

1. **Local Storage**: Voice recordings and transcriptions are stored in IndexedDB, which is used as blob storage and a place to store all of your data like text and transcriptions.

2. **Transcription Service**: The only data sent elsewhere is your recording to an external transcription service—if you choose one. You have the following options:
   - External services like OpenAI, Groq, or ElevenLabs (with your own API keys)
   - A local transcription service such as Speaches, which keeps everything on-device

3. Configurable Settings: You can change the transcription service in the settings to ensure maximum local functionality and privacy.

## Installation

### Desktop App (Recommended)
Download the latest release for your platform:
- **macOS**: [Apple Silicon](https://github.com/braden-w/whispering/releases/latest) | [Intel](https://github.com/braden-w/whispering/releases/latest)
- **Windows**: [64-bit Installer](https://github.com/braden-w/whispering/releases/latest)
- **Linux**: [AppImage](https://github.com/braden-w/whispering/releases/latest) | [DEB](https://github.com/braden-w/whispering/releases/latest)

#### macOS Installation
1. Download the appropriate `.dmg` file for your processor
2. Open the `.dmg` file and drag to Applications
3. If you see "unverified developer" warning, right-click and select "Open"
4. Apple Silicon troubleshooting: If you get a "damaged" error, run:
   ```bash
   xattr -cr /Applications/Whispering.app
   ```

#### Windows Installation
1. Download the `.msi` installer
2. Run the installer (click "More Info" → "Run Anyway" if prompted)
3. Follow the installation wizard

#### Linux Installation
Choose your preferred package format:

AppImage (Universal):
```bash
chmod +x whispering_x.x.x_amd64.AppImage
./whispering_x.x.x_amd64.AppImage
```

DEB Package (Debian/Ubuntu):
```bash
sudo dpkg -i whispering_x.x.x_amd64.deb
sudo apt-get install -f  # Fix dependencies if needed
```

### Web App
Visit [whispering.bradenwong.com](https://whispering.bradenwong.com) for the browser version.

### Chrome Extension (Temporarily Disabled)
The Chrome Extension is currently temporarily disabled while we stabilize recent changes. When available, it provides:
- A Whispering icon on the Chrome extensions bar for quick access
- Recording buttons directly integrated into ChatGPT and Claude websites
- Global shortcut support (`Ctrl/Cmd + Shift + X`) from any website
- Automatic transcription copying and pasting

## Getting Started

### 1. Choose Your Provider
Get an API key from any supported service:
- [Groq](https://console.groq.com) - Fastest & cheapest
- [OpenAI](https://platform.openai.com)
- [ElevenLabs](https://elevenlabs.io)
- Local - Use Speaches for complete privacy

### 2. Configure Whispering
1. Open Settings → API Keys
2. Add your chosen provider's key
3. Select your preferred model

### 3. Start Transcribing
- **Global**: Press `Ctrl/Cmd + Shift + ;` anywhere
- **In-app**: Click the microphone button
- **Automatic**: Enable voice activity detection

## Usage

### Desktop App
After installing the Whispering desktop app, press `Ctrl/Cmd + Shift + ;` (configurable in settings) to start recording from anywhere on your desktop. The transcription will be automatically copied into your clipboard and pasted, though both features can be toggled in the settings.

### Web App
The web app is accessible via [whispering.bradenwong.com](https://whispering.bradenwong.com). Click the microphone button to record your voice, and then click the square button when you're done. Your transcription will appear in the text box.

### Chrome Extension
When available, access the extension from the Chrome toolbar or use the global shortcut. The extension communicates with [whispering.bradenwong.com](https://whispering.bradenwong.com), automatically creating a background tab if needed.

## Built With Modern Web Technologies

Whispering showcases the power of modern web development as a comprehensive example application:

### Web and Desktop
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

### Browser Extension
- [Plasmo](https://docs.plasmo.com): Chrome extension framework
- [React](https://reactjs.org): UI library (Plasmo requirement)
- [shadcn/ui](https://ui.shadcn.com): Component library
- [Chrome API](https://developer.chrome.com/docs/extensions/reference): Extension APIs

### Architecture Patterns
- Service Layer: Platform-agnostic business logic with Result types
- Query Layer: Reactive data management with caching
- RPC Pattern: Unified API interface (`rpc.recordings.getAllRecordings`)
- Dependency Injection: Clean separation of concerns

## Architecture Deep Dive

### Three-Layer Architecture
```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  UI Layer   │ --> │  Query Layer│ --> │ Service Layer│
│ (Svelte 5)  │     │ (TanStack)  │     │   (Pure)     │
└─────────────┘     └─────────────┘     └──────────────┘
      ↑                    │
      └────────────────────┘
         Reactive Updates
```

### Key Patterns

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

## Run Whispering in Local Development Mode

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

## Build The Executable Yourself

If you have concerns about the installers or want more control, you can build the executable yourself. This requires more setup, but it ensures that you are running the code you expect. Such is the beauty of open-source software!

### Desktop

```bash
cd apps/app
pnpm i
pnpm tauri build
```

Find the executable in `apps/app/target/release`

### Firefox Extension
```bash
cd apps/extension
pnpm i
pnpm plasmo build --target=firefox-mv3
```
Output in `apps/extension/build/firefox-mv3-prod`

## Contributing

We welcome contributions! Whispering is built in the open by developers who use it daily.

### Code Style Guidelines
- Follow existing TypeScript and Svelte patterns
- Use Result types for error handling throughout
- Maintain service/query layer separation
- Add comprehensive JSDoc comments for public APIs
- Follow the existing architecture patterns (RPC, dependency injection, etc.)

### Contributing Process
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them
4. Push to your fork: `git push origin your-branch-name`
5. Create a pull request

### Good First Issues
- New transcription service integrations
- Additional transformation templates and AI integrations
- UI/UX improvements and accessibility enhancements
- Performance optimizations
- Documentation improvements
- Test coverage expansion
- Browser extension features (when re-enabled)


## Architecture for Learning

Whispering serves as a comprehensive example of modern web development:

### What You'll Learn
- Svelte 5 Runes: Modern reactivity patterns
- Tauri Integration: Building desktop apps with web technologies
- Clean Architecture: Service/query layer separation
- Type Safety: Result types and comprehensive TypeScript usage
- State Management: TanStack Query patterns
- Local-First: IndexedDB integration and offline capabilities
- Cross-Platform: Platform-specific service implementations

### Code Examples
The codebase includes detailed README files in key directories:
- `/lib/query/README.md` - Query layer patterns
- `/lib/services/README.md` - Service architecture
- `/lib/constants/README.md` - Constants organization
- Components follow shadcn-svelte patterns throughout

## License

Whispering is released under the [MIT License](LICENSE). Use it, modify it, learn from it, and build upon it freely.

## Support and Feedback

If you encounter any issues or have suggestions for improvements, please open an issue on the [GitHub issues tab](https://github.com/braden-w/whispering/issues) or contact me via [whispering@bradenwong.com](mailto:whispering@bradenwong.com). I really appreciate your feedback!

- Issues and Bug Reports: [GitHub Issues](https://github.com/braden-w/whispering/issues)
- Feature Discussions: [GitHub Discussions](https://github.com/braden-w/whispering/discussions)
- Direct Contact: [whispering@bradenwong.com](mailto:whispering@bradenwong.com)

## Sponsors

This project is supported by amazing people and organizations:

<!-- sponsors --><a href="https://github.com/DavidGP"><img src="https://github.com/DavidGP.png" width="60px" alt="" /></a><a href="https://github.com/cgbur"><img src="https://github.com/cgbur.png" width="60px" alt="Chris Burgess" /></a><a href="https://github.com/Wstnn"><img src="https://github.com/Wstnn.png" width="60px" alt="" /></a><a href="https://github.com/rkhrkh"><img src="https://github.com/rkhrkh.png" width="60px" alt="" /></a><a href="https://github.com/doxgt"><img src="https://github.com/doxgt.png" width="60px" alt="" /></a><a href="https://github.com/worldoptimizer"><img src="https://github.com/worldoptimizer.png" width="60px" alt="Max Ziebell" /></a><a href="https://github.com/AlpSantoGlobalMomentumLLC"><img src="https://github.com/AlpSantoGlobalMomentumLLC.png" width="60px" alt="" /></a><!-- sponsors -->

---

Transcription should be free, open, and accessible to everyone. Join us in making it so.

Thank you for using Whispering and happy writing!