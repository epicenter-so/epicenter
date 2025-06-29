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
├── transformer.ts              # Text transformation service
├── manual-recorder.ts          # Manual recording management
├── cpal-recorder.ts            # CPAL audio recording (desktop)
├── SetTrayIconService.ts       # System tray management
├── global-shortcut-manager.ts  # Global keyboard shortcuts
├── local-shortcut-manager.ts   # Local keyboard shortcuts
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
│   ├── _types.ts             # Shared completion types
│   ├── openai.ts             # OpenAI GPT models
│   ├── anthropic.ts          # Claude models
│   ├── google.ts             # Google AI models
│   └── groq.ts               # Groq completion models
│
# Database Service (special case with dependency injection)
├── db/                        # Database operations
│   ├── index.ts              # Exports DbServiceLive
│   ├── types.ts              # Database service interface
│   ├── dexie.ts              # Dexie (IndexedDB) implementation
│   ├── models.ts             # Database models & types
│   └── _schemas.ts           # Internal schema definitions
│
# Utility Services
└── shortcuts/                 # Keyboard shortcut utilities
    └── shortcut-trigger-state.ts
```

## Service Patterns

There are two distinct patterns for implementing services in this codebase:

### 1. Single Implementation Services (Derived Types)

For services with only one implementation, we use factory functions and derive the type from the return value. These are typically stored in a single file:

#### File Structure
```
services/
├── vad.ts                    # Single file containing both types and implementation
├── transformer.ts            # Complex service with dependency injection
├── manual-recorder.ts        # Service managing recording state
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

The `Live` suffix denotes the production instance used at runtime.

## Core Concepts

### Result Types

All services return `Result<T, E>` types for consistent error handling using `tryAsync` and `trySync` helpers:

```typescript
import { Ok, Err, type Result, tryAsync, trySync } from '@epicenterhq/result';

// Using tryAsync for async operations
async function transcribe(
	blob: Blob,
): Promise<Result<string, TranscriptionError>> {
	return tryAsync({
		try: () => apiCall(blob),
		mapError: (error): TranscriptionError => ({
			name: 'TranscriptionError',
			message: 'Failed to transcribe audio',
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

## Detailed Examples

### Example 1: Single File Service (VAD Service)

**File:** `services/vad.ts`

Complete implementation in a single file with derived types:

```typescript
import { Err, Ok, tryAsync, trySync } from '@epicenterhq/result';
import type { VadState } from '$lib/constants';
import { WhisperingError } from '$lib/result';
import { MicVAD, utils } from '@ricky0123/vad-web';

export function createVadServiceWeb() {
	let maybeVad: MicVAD | null = null;
	let vadState: VadState = 'IDLE';

	return {
		getVadState(): VadState {
			return vadState;
		},

		async startActiveListening({
			onSpeechStart,
			onSpeechEnd,
			deviceId,
		}: {
			onSpeechStart: () => void;
			onSpeechEnd: (blob: Blob) => void;
			deviceId: string | null;
		}) {
			if (!maybeVad) {
				const { data: newVad, error: initializeVadError } = await tryAsync({
					try: () => MicVAD.new({
						additionalAudioConstraints: deviceId ? { deviceId } : undefined,
						submitUserSpeechOnPause: true,
						onSpeechStart: () => {
							vadState = 'SPEECH_DETECTED';
							onSpeechStart();
						},
						onSpeechEnd: (audio) => {
							vadState = 'LISTENING';
							const wavBuffer = utils.encodeWAV(audio);
							const blob = new Blob([wavBuffer], { type: 'audio/wav' });
							onSpeechEnd(blob);
						},
						model: 'v5',
					}),
					mapError: (error) => WhisperingError({
						title: 'Failed to start voice activated capture',
						description: 'Your voice activated capture could not be started.',
						context: {},
						cause: error,
					}),
				});
				if (initializeVadError) return Err(initializeVadError);
				maybeVad = newVad;
			}

			vadState = 'LISTENING';
			return Ok(undefined);
		},

		async stopActiveListening() {
			if (!maybeVad) return Ok(undefined);
			
			const vad = maybeVad;
			const { error } = trySync({
				try: () => vad.destroy(),
				mapError: (error) => WhisperingError({
					title: 'Failed to stop Voice Activity Detector',
					description: error instanceof Error ? error.message : 'Failed to stop VAD',
					context: {},
					cause: error,
				}),
			});
			
			if (error) return Err(error);
			maybeVad = null;
			vadState = 'IDLE';
			return Ok(undefined);
		},
	};
}

// Export the live instance directly
export const VadServiceLive = createVadServiceWeb();

// Type is derived from the factory function
export type VadService = ReturnType<typeof createVadServiceWeb>;
```

### Example 2: Multiple Transcription Services (Single Implementation Pattern)

When you have multiple services with similar purposes but different implementations:

```typescript
// openai.ts
export function createOpenaiTranscriptionService({ apiKey }: { apiKey: string }) {
	return {
		async transcribe(
			blob: Blob,
			options: { model: string; language?: string },
		): Promise<Result<string, TranscriptionError>> {
			// OpenAI-specific implementation
		},
	};
}

export const openaiTranscriptionServiceLive = createOpenaiTranscriptionService({
	apiKey: settings.value['apiKeys.openai'],
});

export type OpenaiTranscriptionService = ReturnType<typeof createOpenaiTranscriptionService>;

// groq.ts
export function createGroqTranscriptionService({ apiKey }: { apiKey: string }) {
	return {
		async transcribe(
			blob: Blob,
			options: { model: string; language?: string },
		): Promise<Result<string, TranscriptionError>> {
			// Groq-specific implementation
		},
	};
}

export const groqTranscriptionServiceLive = createGroqTranscriptionService({
	apiKey: settings.value['apiKeys.groq'],
});

export type GroqTranscriptionService = ReturnType<typeof createGroqTranscriptionService>;

// index.ts - Export all transcription services
export {
	openaiTranscriptionServiceLive as openai,
	groqTranscriptionServiceLive as groq,
	elevenlabsTranscriptionServiceLive as elevenlabs,
};
```

### Example 3: Platform-Specific Service (Dependency Injection Pattern)

Services that need different implementations for desktop vs web:

```typescript
// types.ts
export type NotificationService = {
	showNotification(options: NotificationOptions): Promise<Result<void, NotificationError>>;
	requestPermission(): Promise<Result<NotificationPermission, NotificationError>>;
};

// desktop.ts
export function createNotificationServiceDesktop(): NotificationService {
	return {
		async showNotification(options) {
			return tryAsync({
				try: () => sendNotification(options), // Tauri API
				mapError: (error): NotificationError => ({
					name: 'NotificationError',
					message: 'Failed to show desktop notification',
					cause: error,
				}),
			});
		},
		
		async requestPermission() {
			// Desktop always has permission
			return Ok('granted' as NotificationPermission);
		},
	};
}

// web.ts
export function createNotificationServiceWeb(): NotificationService {
	return {
		async showNotification(options) {
			return tryAsync({
				try: () => new Notification(options.title, options),
				mapError: (error): NotificationError => ({
					name: 'NotificationError',
					message: 'Failed to show web notification',
					cause: error,
				}),
			});
		},
		
		async requestPermission() {
			return tryAsync({
				try: () => Notification.requestPermission(),
				mapError: (error): NotificationError => ({
					name: 'NotificationError',
					message: 'Failed to request notification permission',
					cause: error,
				}),
			});
		},
	};
}

// index.ts
export const NotificationServiceLive = window.__TAURI_INTERNALS__
	? createNotificationServiceDesktop()
	: createNotificationServiceWeb();
```

### Example 4: Database Service with Dependency Injection

```typescript
// dexie.ts
export function createDbServiceDexie({
	DownloadService,
}: {
	DownloadService: DownloadService;
}) {
	return {
		async downloadRecording(recordingId: string): Promise<Result<void, DbServiceError>> {
			const { data: recording, error } = await this.getRecordingById(recordingId);
			if (error) return Err(error);
			
			// Uses injected DownloadService
			const downloadResult = await DownloadService.downloadFile({
				url: recording.audioUrl,
				filename: `${recording.title}.webm`,
			});
			
			return downloadResult.mapError((error): DbServiceError => ({
				name: 'DbServiceError',
				message: 'Failed to download recording',
				cause: error,
			}));
		},
		
		// Other database methods...
	};
}

// index.ts
export const DbServiceLive = createDbServiceDexie({
	DownloadService: DownloadServiceLive,
});
```

## Best Practices

1. **Pure Functions** - No side effects except the intended operation
2. **Error Handling** - Always return Result types, never throw
3. **Platform Agnostic APIs** - Same interface for all platforms
4. **Testability** - Services should be easily unit testable
5. **Single Responsibility** - Each service handles one concern

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

| Aspect         | Services     | Query Layer              |
| -------------- | ------------ | ------------------------ |
| State          | Stateless    | Stateful (cache)         |
| Dependencies   | None         | Settings, other queries  |
| Error Handling | Result types | Result types + UI toasts |
| Usage          | Direct calls | Through TanStack Query   |
| Reactivity     | None         | Reactive subscriptions   |

Services provide the foundation that the query layer builds upon to create a reactive, user-friendly application.
