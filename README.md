<p align="center">
  <a href="https://whispering.bradenwong.com">
    <img width="180" src="./apps/app/src-tauri/recorder-state-icons/studio_microphone.png" alt="Whispering">
  </a>
  <h1 align="center">Whispering</h1>
  <p align="center">Seamless dictation powered by OpenAI's Whisper Model</p>
</p>

<p align="center">
  <!-- Latest Version Badge -->
  <img src="https://img.shields.io/github/v/release/braden-w/whispering?style=flat-square&label=Latest%20Version&color=brightgreen" />
  <!-- License Badge -->
  <a href="LICENSE" target="_blank">
    <img alt="MIT License" src="https://img.shields.io/github/license/braden-w/whispering.svg?style=flat-square" />
  </a>
  <!-- Badges for Technologies -->
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-blue?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Rust" src="https://img.shields.io/badge/-Rust-orange?style=flat-square&logo=rust&logoColor=white" />
  <!-- Platform Support Badges -->
  <a href="https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo" target="_blank">
    <img alt="Chrome" src="https://img.shields.io/chrome-web-store/stars/oilbfihknpdbpfkcncojikmooipnlglo?color=blue&label=Chrome&style=flat-square&logo=google-chrome&logoColor=white" />
  </a>
  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="macOS" src="https://img.shields.io/badge/-macOS-black?style=flat-square&logo=apple&logoColor=white" />
  </a>
  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="Windows" src="https://img.shields.io/badge/-Windows-blue?style=flat-square&logo=windows&logoColor=white" />
  </a>
  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="Linux" src="https://img.shields.io/badge/-Linux-yellow?style=flat-square&logo=linux&logoColor=white" />
  </a>
</p>


## About

Whispering is an open-source transcription application that provides global speech-to-text functionality, with options such as keyboard shortcuts and automatic copy and paste to make dictating as seamless as possible.

Under the hood, it's powered by OpenAI's Whisper model, making it significantly more accurate than built-in dictation.

> **Important Note**: Whispering is designed primarily as a transcription tool, not a recording tool. For longer recordings where reliability is crucial, I recommend using a dedicated recording app on your phone or device that utilizes native recording APIs. This ensures optimal audio quality and recording stability.

## Demos

https://github.com/user-attachments/assets/eca93701-10a0-4d91-b38a-f715bd7e0357

https://github.com/user-attachments/assets/a7934f1f-d08b-4037-9bbc-aadd1b13501e

## Key Features

1. **Global Transcription**: Access Whisper's speech-to-text functionality anywhere with a global keyboard shortcut or within two button clicks.
2. **Cross-Platform Experience**:
   - Desktop App: Enables global transcription across all applications.
   - Browser Extension: Provides global transcription in the browser by communicating with the web app.
3. **Chat Integration**: The browser extension adds a recording button to ChatGPT and Claude websites, allowing direct voice input and transcription in the chat interface.
4. **Transcription Management**: Review and edit transcriptions within the Whispering app to ensure accuracy and clarity.
5. **Automatic Clipboard Integration**: Once transcription is complete, the text is automatically copied to your clipboard. An option for automatic pasting is also available.

## How is my data stored?

Whispering stores as much data as possible locally on your device, including recordings and text transcriptions. This approach ensures maximum privacy and data security. Here's an overview of how data is handled:

1. **Local Storage**: Voice recordings and transcriptions are stored in IndexedDB, which is used as a blob storage and a place to store all of your data like text and transcriptions.

2. **Transcription Service**: The only data sent elsewhere is your recording to an external transcription service—if you choose one. You have the following options:
   - External services like OpenAI or Groq
   - A local transcription service such as `Speaches`, which keeps everything on-device

3. **Configurable Settings**: You can change the transcription service in the settings to ensure maximum local functionality.


## Installation

### Web App

Visit [whispering.bradenwong.com](https://whispering.bradenwong.com/), which has the latest version of the `apps/app` folder hosted on Vercel.

### Chrome Extension

**Temporarily Unavailable**: The Chrome Extension is currently temporarily disabled while we stabilize recent changes to the desktop app. We expect to restore it later this summer. You can still find the listing [here](https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo), but installation is currently unavailable.

### Desktop App

To download and install the Whispering desktop app, follow the steps for your operating system:

#### Windows

1. Download the installation package ending in `.msi` from the [latest releases page](https://github.com/braden-w/whispering/releases).
2. Open the downloaded `.msi` file to run the installer.
3. If prompted as unsafe, click on `More Info` -> `Run Anyway` to proceed with the installation.
4. Follow the on-screen instructions to complete the installation.

#### macOS

For macOS, follow these steps to install Whispering:

1. **Download the installation package**:
   - Visit the [latest releases page](https://github.com/braden-w/whispering/releases).
   - Choose the appropriate package:
     - For Apple Silicon: `Whispering_x.x.x_aarch64.dmg`
     - For Intel: `Whispering_x.x.x_x64.dmg`

2. **Install the application**:
   - Open the downloaded `.dmg` file.
   - Drag the Whispering app to the Applications folder.

3. **Launch Whispering**:
   - Open Whispering from the Applications folder.
   - If you see a warning about unverified developer:
     - Click `Cancel`
     - Right-click the app in Finder and select `Open`

4. **Troubleshooting** (Apple Silicon only):
   If you encounter the error `"Whispering" is damaged and can't be opened`:
   - Open Terminal
   - Run the following command:
     ```bash
     xattr -cr /Applications/Whispering.app
     ```
   - Try opening the application again

After completing these steps, Whispering should be ready to use on your macOS system.

#### Linux

For Linux, there are multiple installation options available. Choose the one that suits your environment:

1. **AppImage**:

   - Download the `.AppImage` file from the [latest releases page](https://github.com/braden-w/whispering/releases).
   - Make the file executable:
     ```bash
     chmod +x whispering_x.x.x_amd64.AppImage
     ```
   - Run the AppImage:
     ```bash
     ./whispering_x.x.x_amd64.AppImage
     ```

2. **DEB Package (Debian/Ubuntu)**:
   - Download the `.deb` file from the [latest releases page](https://github.com/braden-w/whispering/releases).
   - Install the package using `dpkg`:
     ```bash
     sudo dpkg -i whispering_x.x.x_amd64.deb
     ```
   - Resolve any dependency issues:
     ```bash
     sudo apt-get install -f
     ```

After installation, the app will be ready to use.

## Usage

### Chrome Extension

After installing the Chrome Extension, you will find a Whispering icon on the Chrome extensions bar. Click on this icon to open the extension. Click the microphone button to record your voice, and then click the square button when you're done. Your transcription will appear in the text box below.

To access the ChatGPT or Claude feature, navigate to the ChatGPT or Claude web page. You'll see a new recording button in the chat interface. Click this button to start and stop recording, and the transcribed text will be automatically inserted into the chat input field.

To access the shortcut feature, press <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> or <kbd>Command</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> (later configurable through Chrome extension shortcuts) to start recording from any website. The transcription will be automatically copied into your clipboard and paste into the current input field.

The Chrome Extension communicates with [whispering.bradenwong.com](https://whispering.bradenwong.com), and will automatically attempt to create a tab in the background if it does not find one. Most bugs can be attributed to this communication failing, such as rare instances where the tab falls asleep.

### Web App

The web app is accessible via [whispering.bradenwong.com](https://whispering.bradenwong.com). Click the microphone button to record your voice, and then click the square button when you're done. Your transcription will appear in the text box.

### Desktop App

After installing the Whispering desktop app, press <kbd>Control/Command</kbd> + <kbd>Shift</kbd> + <kbd>;</kbd> (configurable in settings) to start recording from anywhere on your desktop. The transcription will be automatically copied into your clipboard and pasted, though both features can be toggled in the settings.

## Built With

#### Web and Desktop

The Whispering app is built using the following technologies and libraries:

- [Svelte 5](https://svelte.dev): The UI reactivity library of choice.
- [SvelteKit](https://kit.svelte.dev/docs): For routing and static site generation, used for making both the website and the static frontend for the Tauri app.
- [Tauri](https://tauri.studio/en/docs/intro/): The desktop app framework.
- [Effect-TS](https://github.com/Effect-TS/effect): To sprinkle some functional programming and write extremely type-safe functions, where errors are included in the return type of the function signature.
- [Svelte Sonner](https://svelte-sonner.vercel.app/): A simple, customizable toast library for Svelte applications. Used to capture and display errors bubbled up via Effect-TS using the `renderAsToast` function.
- [TanStack Table](https://tanstack.com/table): To power all data tables.
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API): A low-level API for storing large amounts of structured data in the browser. Synchronized with Tanstack Table.
- [ShadCN-Svelte](https://github.com/huntabyte/shadcn-svelte): The UI component library of choice.
- [TailwindCSS](https://tailwindcss.com/docs): A utility-first CSS framework for rapidly building custom user interfaces.
- [Turborepo](https://turborepo.org/): For monorepo management, so that `apps/app` and `apps/extension` can share the same codebase, drastically reducing code duplication and more importantly, keeping a single source of truth.
- [Rust](https://www.rust-lang.org): For extending desktop app features, such as using the `enigo` crate for handling automatic pasting.
- [Vercel](https://vercel.com/): Hosting that's decent for a hobby project and has nice Turborepo integrations.
- [Zapsplat.com](https://www.zapsplat.com/): A royalty-free sound effects library.

#### Extension

The Whispering Chrome extension is built using:

- [Plasmo](https://docs.plasmo.com/): A framework for building Chrome extensions. We use the [relay flow](https://docs.plasmo.com/framework/messaging#relay-flow) to communicate to the Whispering website.
- [Effect-TS](https://github.com/Effect-TS/effect): To sprinkle some functional programming and write extremely type-safe functions, where errors are included in the return type of the function signature.
- [React](https://reactjs.org): The UI reactivity library for the Chrome extension, as Plasmo unfortunately doesn't support Svelte 5.
- [ShadCN](https://github.com/shadcn): The UI component library for the Chrome extension.
- [TailwindCSS](https://tailwindcss.com/docs): A utility-first CSS framework for rapidly building custom user interfaces.
- [Chrome API](https://developer.chrome.com/docs/extensions/reference/): The Chrome extension API.
- [Zapsplat.com](https://www.zapsplat.com/): A royalty-free sound effects library.

## Run Whispering in Local Development Mode

To set up the project on your local machine, follow these steps:

1. Clone the repository: `git clone https://github.com/braden-w/whispering.git`
2. Change into the project directory: `cd whispering`
3. Install the necessary dependencies: `pnpm i`

To run the Whispering desktop app and website in development mode:

4. Change into the app directory: `cd apps/app`
5. Run the development server: `pnpm tauri dev`

The desktop app should automatically open for local development. To develop the web app, open your browser and navigate to `http://localhost:5173`.

To run the Whispering Chrome extension in development mode:

4. Change into the extension directory: `cd apps/extension`
5. Run the development server: `pnpm dev --target=chrome-mv3`

To develop the chrome extension, load it into Chrome by navigating to `chrome://extensions`, enabling developer mode, and loading the `apps/extension/build/{platform}-{manifest-version}-dev` folder as an unpacked extension.

## Build The Executable Yourself

If you ever have concerns regarding the trustworthiness of the installers or would like more control, you can always build the executable yourself. This requires more setup, but it ensures that you are running the code you expect. Such is the beauty of open-source software!

### Chrome

1. Change into the extension directory: `cd apps/extension`
2. Install the necessary dependencies: `pnpm i`
3. Run Plasmo build: `pnpm plasmo build --target=chrome-mv3`
4. Output should be found in `apps/extension/build/chrome-mv3-prod`, which can be loaded into Chrome as an unpacked extension.
5. Alternatively, you can build the extension for the Chrome Web Store: `pnpm plasmo build --target=chrome-mv3 --release`

### Firefox

1. Change into the extension directory: `cd apps/extension`
2. Install the necessary dependencies: `pnpm i`
3. Run Plasmo build: `pnpm plasmo build --target=firefox-mv3`
4. Output should be found in `apps/extension/build/firefox-mv3-prod`, which can be loaded into Chrome as an unpacked extension.
5. Alternatively, you can build the extension for the Chrome Web Store: `pnpm plasmo build --target=firefox-mv3 --release`

### Desktop

1. Change into the app directory: `cd apps/app`
2. Install the necessary dependencies: `pnpm i`
3. Run Tauri Build: `pnpm tauri build`
4. You can find the executable in the `apps/app/target/release` directory.

## Contributing

We welcome contributions from the community! If you'd like to contribute to Whispering, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name` or `git checkout -b fix/your-bugfix-name`
3. Make your changes and commit them with a descriptive message.
4. Push your branch to your forked repository: `git push origin your-branch-name`
5. Create a pull request from your forked repository to the original one.

Please ensure your code follows established conventions and is well-documented.

## License

Whispering is released under the [MIT License](https://opensource.org/licenses/MIT).

## Sponsors

This project is supported by the following amazing people and organizations:

<!-- sponsors --><a href="https://github.com/DavidGP"><img src="https://github.com/DavidGP.png" width="60px" alt="" /></a><a href="https://github.com/cgbur"><img src="https://github.com/cgbur.png" width="60px" alt="Chris Burgess" /></a><a href="https://github.com/Wstnn"><img src="https://github.com/Wstnn.png" width="60px" alt="" /></a><a href="https://github.com/rkhrkh"><img src="https://github.com/rkhrkh.png" width="60px" alt="" /></a><a href="https://github.com/doxgt"><img src="https://github.com/doxgt.png" width="60px" alt="" /></a><a href="https://github.com/worldoptimizer"><img src="https://github.com/worldoptimizer.png" width="60px" alt="Max Ziebell" /></a><a href="https://github.com/AlpSantoGlobalMomentumLLC"><img src="https://github.com/AlpSantoGlobalMomentumLLC.png" width="60px" alt="" /></a><!-- sponsors -->

## Support and Feedback

If you encounter any issues or have suggestions for improvements, please open an issue on the [GitHub issues tab](https://github.com/braden-w/whispering/issues) or contact me via [whispering@bradenwong.com](mailto:whispering@bradenwong.com). I really appreciate your feedback!

Thank you for using Whispering and happy writing!
