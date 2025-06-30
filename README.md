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

Whispering is a free and open source transcription app. Bring your own API key from providers like OpenAI, Groq, or ElevenLabs, and pay only cents per hour instead of monthly subscriptions. Or use a local transcription service like `Speaches`, which keeps everything on-device. Your audio goes directly to your chosen service—no middleman, no tracking, no data collection.

> We believe transcription should be accessible to everyone. Essential productivity tools shouldn't be locked behind paywalls or closed source code. With Whispering, you own your data, you audit the code, and you control your privacy.

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

## Quick Start

1. **[Download](https://github.com/braden-w/whispering/releases/latest)** the app for your platform
2. **Add your API key** from [Groq](https://console.groq.com/keys) (fastest & cheapest) or [OpenAI](https://platform.openai.com/api-keys)
3. **Press** `Ctrl/Cmd + Shift + ;` to transcribe anywhere

That's it. No credit card. No subscription. No tracking.

## Demo Videos

https://github.com/user-attachments/assets/eca93701-10a0-4d91-b38a-f715bd7e0357

https://github.com/user-attachments/assets/a7934f1f-d08b-4037-9bbc-aadd1b13501e

## Installation

### Desktop App (Recommended)
**[Download Latest Release](https://github.com/braden-w/whispering/releases/latest)**

- **macOS**: [Apple Silicon](https://github.com/braden-w/whispering/releases/latest) | [Intel](https://github.com/braden-w/whispering/releases/latest)
- **Windows**: [64-bit Installer](https://github.com/braden-w/whispering/releases/latest)
- **Linux**: [AppImage](https://github.com/braden-w/whispering/releases/latest) | [DEB](https://github.com/braden-w/whispering/releases/latest)

#### Platform-Specific Notes

**macOS**: If you see "unverified developer" warning, right-click and select "Open". For "damaged" error on Apple Silicon:
```bash
xattr -cr /Applications/Whispering.app
```

**Windows**: Click "More Info" → "Run Anyway" if prompted by Windows Defender.

**Linux AppImage**: 
```bash
chmod +x whispering_x.x.x_amd64.AppImage
./whispering_x.x.x_amd64.AppImage
```

### Web App
Visit [whispering.bradenwong.com](https://whispering.bradenwong.com) for the browser version.

## Key Features

**Global Transcription**: Access speech-to-text anywhere with `Ctrl/Cmd + Shift + ;`. Works across all desktop applications.

**Multiple Providers**: Choose from OpenAI Whisper, Groq (fastest), ElevenLabs, or local Speaches for complete privacy.

**Recording Modes**: Manual click-to-record or hands-free Voice Activity Detection (VAD) with automatic silence trimming.

**AI Transformations**: Post-process transcriptions with grammar correction, formatting, translation, and custom templates using GPT-4, Claude, Gemini, or Llama models.

**Transcription Management**: Review, edit, and organize all transcriptions with search, filtering, and export capabilities.

**Automatic Clipboard**: Transcribed text is automatically copied to clipboard with optional auto-paste.

> **Note**: Whispering is designed primarily as a transcription tool, not long-form recording. For extended recordings, use a dedicated recording app for optimal reliability.

## Configuration

### Setup Your Transcription Service

1. Open Whispering → **Settings** (⚙️) → **Transcription**
2. Select your service:
   - **[Groq](https://console.groq.com/keys)** - Recommended for speed & cost (`distil-whisper-large-v3-en` is $0.02/hour)
   - **[OpenAI](https://platform.openai.com/api-keys)** - Industry standard
   - **[ElevenLabs](https://elevenlabs.io/app/settings/api-keys)** - High quality
   - **Speaches** - Local transcription (no API key needed)
3. Add your API key for the chosen service

### AI Transformations (Optional)

Enhance transcriptions with AI-powered post-processing:

1. Navigate to **Transformations** (📚) → "Create Transformation"
2. Add **Prompt Transform** step
3. Choose your AI model (GPT-4, Claude, Gemini, etc.)
4. Configure prompts with `{{input}}` placeholder:

```
System: You are a professional text formatter.
User: Please format this transcription: {{input}}
- Fix capitalization and punctuation
- Break into logical paragraphs
- Maintain original meaning
```

Chain multiple steps for complex workflows (format → remove filler words → translate).

## API Key Providers

### Transcription Services
- **[Groq](https://console.groq.com/keys)** - Fastest & cheapest
- **[OpenAI](https://platform.openai.com/api-keys)** - Industry standard ([Enable billing](https://platform.openai.com/settings/organization/billing/overview))
- **[ElevenLabs](https://elevenlabs.io/app/settings/api-keys)** - High-quality voice AI
- **Local** - Use Speaches for complete privacy

### Transformation Services (Optional)
- **[OpenAI](https://platform.openai.com/api-keys)** - GPT-4 and GPT-3.5
- **[Anthropic](https://console.anthropic.com/settings/keys)** - Claude models
- **[Google](https://aistudio.google.com/app/apikey)** - Gemini models
- **[Groq](https://console.groq.com/keys)** - Fast Llama models

## Usage

### Desktop App
Press `Ctrl/Cmd + Shift + ;` anywhere to start recording. Transcription automatically copies to clipboard.

### Web App
Visit [whispering.bradenwong.com](https://whispering.bradenwong.com) and click the microphone button.

## Development

### Local Development
```bash
git clone https://github.com/braden-w/whispering.git
cd whispering
pnpm i

# Run desktop app
cd apps/app
pnpm tauri dev
```

### Build From Source
```bash
cd apps/app
pnpm i
pnpm tauri build
```
Find executable in `apps/app/target/release`

## Built With Modern Web Technologies

**Frontend**: Svelte 5, SvelteKit, TailwindCSS, shadcn-svelte
**Desktop**: Tauri, Rust
**State Management**: TanStack Query, Effect-TS
**Storage**: IndexedDB, Dexie.js
**Architecture**: Service/Query layer separation, RPC patterns

## Contributing

We welcome contributions! Whispering is built by developers who use it daily.

### Good First Issues
- New transcription service integrations
- UI/UX improvements and accessibility
- Performance optimizations
- Documentation improvements
- Test coverage expansion

### Process
1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature-name`
3. Make changes and commit
4. Push: `git push origin your-branch-name`
5. Create pull request

Follow existing TypeScript/Svelte patterns, use Result types for error handling, and maintain service/query layer separation.

## Support and Feedback

- **Issues & Bugs**: [GitHub Issues](https://github.com/braden-w/whispering/issues)
- **Feature Discussions**: [GitHub Discussions](https://github.com/braden-w/whispering/discussions)
- **Direct Contact**: [whispering@bradenwong.com](mailto:whispering@bradenwong.com)

## Sponsors

This project is supported by amazing people and organizations:

<!-- sponsors --><a href="https://github.com/DavidGP"><img src="https://github.com/DavidGP.png" width="60px" alt="" /></a><a href="https://github.com/cgbur"><img src="https://github.com/cgbur.png" width="60px" alt="Chris Burgess" /></a><a href="https://github.com/Wstnn"><img src="https://github.com/Wstnn.png" width="60px" alt="" /></a><a href="https://github.com/rkhrkh"><img src="https://github.com/rkhrkh.png" width="60px" alt="" /></a><a href="https://github.com/doxgt"><img src="https://github.com/doxgt.png" width="60px" alt="" /></a><a href="https://github.com/worldoptimizer"><img src="https://github.com/worldoptimizer.png" width="60px" alt="Max Ziebell" /></a><a href="https://github.com/AlpSantoGlobalMomentumLLC"><img src="https://github.com/AlpSantoGlobalMomentumLLC.png" width="60px" alt="" /></a><!-- sponsors -->

## License

Whispering is released under the [MIT License](LICENSE).

---

Transcription should be free, open, and accessible to everyone. Join us in making it so.

Thank you for using Whispering and happy writing!