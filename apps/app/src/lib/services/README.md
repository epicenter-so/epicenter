# Services Layer

The services layer contains pure, isolated business logic with no UI concerns or reactive state. Services are platform-aware and provide consistent APIs regardless of the runtime environment.

## Overview

This folder contains all core business logic that:

- Operates independently of UI frameworks
- Handles platform-specific implementations (Desktop/Web)
- Returns consistent Result types for error handling
- Has no dependencies on app state or settings
- Provides simple input → output transformations

## Complete Folder Structure

```
services/
├── index.ts                    # Main export file - re-exports all services
├── README.md                   # This documentation
│
# Single Implementation Services (single files)
├── vad.ts                      # Voice Activity Detection service
├── manual-recorder.ts          # Manual recording management
├── cpal-recorder.ts            # CPAL audio recording (desktop)
├── global-shortcut-manager.ts  # Global keyboard shortcuts
├── local-shortcut-manager.ts   # Local keyboard shortcuts
├── tray.ts                     # System tray management
│
# Platform-Specific Services (folders with multiple implementations)
├── clipboard/                  # Clipboard operations
│   ├── index.ts               # Platform detection & Live export
│   ├── types.ts               # Shared ClipboardService interface
│   ├── desktop.ts             # Tauri clipboard implementation
│   ├── web.ts                 # Browser clipboard implementation
│   └── extension.ts           # Browser extension implementation
│
├── notifications/             # System notifications
│   ├── index.ts              # Platform detection & Live export
│   ├── types.ts              # NotificationService interface
│   ├── desktop.ts            # Native desktop notifications
│   └── web.ts                # Web Notifications API
│
├── download/                  # File download handling
│   ├── index.ts
│   ├── types.ts
│   ├── desktop.ts            # Tauri file system operations
│   └── web.ts                # Browser download API
│
├── http/                      # HTTP client
│   ├── index.ts
│   ├── types.ts
│   ├── desktop.ts            # Tauri HTTP client
│   └── web.ts                # Fetch API wrapper
│
├── os/                        # Operating system info
│   ├── index.ts
│   ├── types.ts
│   ├── desktop.ts            # Native OS information
│   └── web.ts                # Browser-based OS detection
│
├── sound/                     # Sound playback
│   ├── index.ts
│   ├── types.ts
│   ├── desktop.ts
│   ├── web.ts
│   ├── _audioElements.ts     # Shared audio element management
│   └── assets/               # Sound files
│       └── *.mp3
│
# Services with Multiple Providers (folders with similar services)
├── transcription/             # Speech-to-text services
│   ├── index.ts              # Exports all transcription services
│   ├── openai.ts             # OpenAI Whisper implementation
│   ├── groq.ts               # Groq transcription
│   ├── elevenlabs.ts         # ElevenLabs transcription
│   └── speaches.ts           # Speaches.ai transcription
│
├── completion/                # LLM completion services
│   ├── index.ts              # Exports all completion services
│   ├── _types.ts             # Shared completion types
│   ├── openai.ts             # OpenAI GPT models
│   ├── anthropic.ts          # Claude models
│   ├── google.ts             # Google AI models
│   └── groq.ts               # Groq completion models
│
# Database Service (special case with dependency injection)
├── db/                        # Database operations
│   ├── index.ts              # Exports DbServiceLive
│   ├── dexie.ts              # Dexie (IndexedDB) implementation
│   └── models/               # Database model implementations
│       ├── index.ts
│       ├── recordings.ts
│       ├── transformations.ts
│       └── transformation-runs.ts
│
# Utility Services
└── _shortcut-trigger-state.ts # Keyboard shortcut utilities
```

## Service Patterns

There are two distinct patterns for implementing services in this codebase:

### 1. Single Implementation Services (Derived Types)

For services with only one implementation, we use factory functions and derive the type from the return value. These are typically stored in a single file:

#### File Structure

```
services/
├── vad.ts                    # Single file containing both types and implementation
├── manual-recorder.ts        # Service managing recording state
├── tray.ts                   # System tray management
└── transcription/           # Multiple similar services
    ├── index.ts             # Re-exports all transcription services
    ├── openai.ts            # OpenAI transcription implementation
    ├── groq.ts              # Groq transcription implementation
    ├── elevenlabs.ts        # ElevenLabs transcription implementation
    └── speaches.ts          # Speaches transcription implementation
```

#### Example Implementation

```typescript
// vad.ts - Service that has same implementation on desktop and web
export function createVadServiceWeb() {
	let maybeVad: MicVAD | null = null;
	let vadState: VadState = 'IDLE';

	return {
		getVadState(): VadState {
			return vadState;
		},

		async startActiveListening({ onSpeechStart, onSpeechEnd, deviceId }) {
			// Implementation...
		},

		async stopActiveListening() {
			// Implementation...
		},
	};
}

// Export the live instance directly
export const VadServiceLive = createVadServiceWeb();

// Type is derived from the factory function
export type VadService = ReturnType<typeof createVadServiceWeb>;
```

### 2. Dependency Injection Services (Platform-Specific)

For services that require different implementations based on platform, we use dependency injection with explicit type definitions and the `Live` suffix:

#### File Structure

```
services/
├── clipboard/               # Platform-specific service
│   ├── index.ts            # Platform detection and Live export
│   ├── types.ts            # Shared interface definition
│   ├── desktop.ts          # Desktop-specific implementation
│   ├── web.ts              # Web-specific implementation
│   └── extension.ts        # Browser extension implementation (optional)
├── notifications/          # Another platform-specific service
│   ├── index.ts
│   ├── types.ts
│   ├── desktop.ts
│   └── web.ts
├── download/
│   ├── index.ts
│   ├── types.ts
│   ├── desktop.ts
│   └── web.ts
└── sound/
    ├── index.ts
    ├── types.ts
    ├── desktop.ts
    ├── web.ts
    ├── _audioElements.ts   # Shared internal utilities
    └── assets/             # Sound files
        └── *.mp3
```

#### Example Implementation

```typescript
// types.ts - Define the explicit interface
export type ClipboardService = {
	setClipboardText(text: string): Promise<Result<void, ClipboardError>>;
	writeTextToCursor(text: string): MaybePromise<Result<void, ClipboardError>>;
};

// desktop.ts - Desktop implementation
export function createClipboardServiceDesktop(): ClipboardService {
	return {
		setClipboardText(text) {
			// Tauri implementation
		},
		writeTextToCursor(text) {
			// Desktop-specific implementation
		},
	};
}

// web.ts - Web implementation
export function createClipboardServiceWeb(): ClipboardService {
	return {
		setClipboardText(text) {
			// Browser API implementation
		},
		writeTextToCursor(text) {
			// Web-specific implementation
		},
	};
}

// index.ts - Platform detection and Live export
export const ClipboardServiceLive = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop()
	: createClipboardServiceWeb();
```

#### When to Use Dependency Injection

Dependency injection is used only when:

1. **Isomorphic API**: The API surface must be exactly the same across all implementations (one-to-one mapping for every feature and type)
2. **Platform-Dependent**: Different implementations are needed for desktop (Tauri) vs web environments
3. **Exactly 1 implementation running**: There should be exactly one implementation running simultaneously across all platforms

Avoid dependency injection when:

4. **"1.5 implementations running simultaneously"**: When you have one service always running (local shortcuts) PLUS another similar service that only runs conditionally on some platforms (global shortcuts only on desktop). This results in desktop running 2 services, web running 1 service = ~1.5 average. Even if APIs are similar, they serve different purposes with different runtime patterns.

5. **"0.5 implementations running simultaneously"**: When you have a service that only runs on one platform with no equivalent on other platforms. This results in desktop running 1 service, web running 0 services = ~0.5 average. Instead of creating empty shell implementations, make it platform-specific and use conditional logic in query/application layer.

The `Live` suffix denotes the production instance used at runtime.

## Core Concepts

### Purity Requirements

Services must be completely pure with no dependencies on global state:

- No imports of settings stores or reactive state
- All external configuration passed as explicit parameters
- No hidden dependencies or side effects beyond the intended operation
- Stateless operations that can be unit tested in isolation

Configuration that services need (like API keys or settings) should be passed from the query layer:

```typescript
// CORRECT - Pure service accepts configuration as parameters
export function createCompletionService(): CompletionService {
	return {
		async complete({ apiKey, prompt }) {
			// apiKey injected from query layer
			const client = new OpenAI({ apiKey });
			// ... implementation
		},
	};
}

// Query layer handles settings injection
const result = await services.completions.openai.complete({
	apiKey: settings.value['apiKeys.openai'], // Handled at query boundary
	prompt,
});
```

### Result Types

All services return `Result<T, E>` types for consistent error handling using `tryAsync` and `trySync` helpers:

```typescript
import { Ok, Err, type Result, tryAsync, trySync } from '@epicenterhq/result';

// Using tryAsync for async operations
async function transcribe(
	blob: Blob,
	options: { apiKey: string; model: string },
): Promise<Result<string, TranscriptionError>> {
	return tryAsync({
		try: () => apiCall(blob, options),
		mapError: (error): TranscriptionError => ({
			name: 'TranscriptionError',
			message: 'Failed to transcribe audio',
			context: { model: options.model },
			cause: error,
		}),
	});
}

// Using trySync for synchronous operations
function parseConfig(json: string): Result<Config, ConfigError> {
	return trySync({
		try: () => JSON.parse(json),
		mapError: (error): ConfigError => ({
			name: 'ConfigError',
			message: 'Invalid configuration format',
			cause: error,
		}),
	});
}
```

### Platform Detection

Services automatically select the right implementation:

```typescript
// index.ts
export const ClipboardServiceLive = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop() // Tauri APIs
	: createClipboardServiceWeb(); // Web APIs
```

## Adding New Services

1. Define the interface in `types.ts`:

```typescript
export type MyService = {
	doSomething(input: string): Promise<Result<Output, MyError>>;
};
```

2. Implement platform-specific versions:

```typescript
// desktop.ts
export function createMyServiceDesktop(): MyService { ... }

// web.ts
export function createMyServiceWeb(): MyService { ... }
```

3. Export the appropriate implementation:

```typescript
// index.ts
export const MyServiceLive = window.__TAURI_INTERNALS__
	? createMyServiceDesktop()
	: createMyServiceWeb();
```

4. Add to the main services export:

```typescript
// services/index.ts
export { MyServiceLive as myService } from './my-service';
```

## Key Differences from Query Layer

| Aspect         | Services                 | Query Layer              |
| -------------- | ------------------------ | ------------------------ |
| State          | Stateless                | Stateful (cache)         |
| Dependencies   | Explicit parameters only | Settings, other queries  |
| Error Handling | Result types             | Result types + UI toasts |
| Usage          | Direct calls             | Through TanStack Query   |
| Reactivity     | None                     | Reactive subscriptions   |

Services provide the pure foundation that the query layer builds upon to create a reactive, user-friendly application. The query layer is responsible for handling settings reactivity and passing configuration to pure services.
