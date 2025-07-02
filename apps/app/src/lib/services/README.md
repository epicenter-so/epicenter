# Services Layer

The services layer provides pure, isolated business logic with no UI dependencies. Services handle platform differences (Desktop/Web) transparently and return consistent `Result<T, E>` types for error handling.

## Core Concepts

### What Are Services?

Services are collections of pure functions that:

- Accept explicit parameters (no hidden dependencies)
- Return `Result<T, E>` types for consistent error handling
- Have no knowledge of UI state, settings, or reactive stores
- Provide identical APIs across platforms (Desktop via Tauri, Web via browser APIs)

### Platform Detection

Services automatically choose the right implementation based off platform at build time:

```typescript
// Automatically selects desktop or web implementation
export const ClipboardServiceLive = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop() // Tauri APIs
	: createClipboardServiceWeb(); // Browser APIs
```

### Result Types

All services use `Result<T, E>` for error handling:

```typescript
import { tryAsync, type Result } from '@epicenterhq/result';

// Services return Results, not thrown errors
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
```

## Service Patterns

### Pattern 1: Single Implementation

Services that work identically across platforms:

```typescript
// vad.ts - Same implementation for desktop and web
export function createVadService() {
	return {
		getVadState(): VadState {
			/* ... */
		},
		async startListening() {
			/* ... */
		},
		async stopListening() {
			/* ... */
		},
	};
}

export type VadService = ReturnType<typeof createVadService>;

export const VadServiceLive = createVadService();
```

### Pattern 2: Platform-Specific Implementation

Services that need different implementations for desktop vs web:

```typescript
// types.ts - Shared interface
export type ClipboardService = {
	setClipboardText(text: string): Promise<Result<void, ClipboardError>>;
	writeTextToCursor(text: string): Promise<Result<void, ClipboardError>>;
};

// desktop.ts - Tauri implementation
export function createClipboardServiceDesktop(): ClipboardService {
	return {
		setClipboardText(text) {
			/* Tauri clipboard API */
		},
		writeTextToCursor(text) {
			/* Desktop-specific implementation */
		},
	};
}

// web.ts - Browser implementation
export function createClipboardServiceWeb(): ClipboardService {
	return {
		setClipboardText(text) {
			/* Browser clipboard API */
		},
		writeTextToCursor(text) {
			/* Web-specific implementation */
		},
	};
}

// index.ts - Platform detection (Live suffix = production instance)
export const ClipboardServiceLive = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop()
	: createClipboardServiceWeb();
```

**When to use platform-specific pattern:**

- Identical API across platforms
- Different underlying implementations
- Exactly one implementation runs at runtime

**When to use single implementation:**

- Same code works on all platforms
- No platform-specific APIs needed

## Configuration Injection

Services are pure and accept configuration as parameters. We never import/use global variables like `settings.value`—that's for the query layer.

```typescript
// ✅ CORRECT - Pure service
export function createCompletionService() {
	return {
		async complete({ apiKey, prompt }) {
			const client = new OpenAI({ apiKey }); // Injected from query layer
			// ...
		},
	};
}

// Query layer injects settings
const result = await services.completion.openai.complete({
	apiKey: settings.value['apiKeys.openai'], // Query layer responsibility
	prompt,
});
```

## Available Services

### Single Implementation Services

- `vad.ts` - Voice Activity Detection
- `manual-recorder.ts` - Recording state management
- `cpal-recorder.ts` - CPAL audio recording (desktop only)
- `global-shortcut-manager.ts` - Global keyboard shortcuts
- `local-shortcut-manager.ts` - Local keyboard shortcuts
- `tray.ts` - System tray management

### Platform-Specific Services

- `clipboard/` - Clipboard operations (Tauri vs Browser API)
- `notifications/` - System notifications (native vs web)
- `download/` - File downloads (filesystem vs browser)
- `http/` - HTTP client (Tauri vs fetch)
- `os/` - Operating system info
- `sound/` - Audio playback

### Multi-Provider Services

- `transcription/` - Speech-to-text (OpenAI, Groq, ElevenLabs, Speaches)
- `completion/` - LLM completions (OpenAI, Anthropic, Google, Groq)

### Database Service

- `db/` - Database operations (Dexie/IndexedDB)

## Quick Start

Add a new platform-specific service:

```typescript
// 1. Define interface in types.ts
export type MyService = {
	doSomething(input: string): Promise<Result<Output, MyError>>;
};

// 2. Implement for each platform
// desktop.ts
export function createMyServiceDesktop(): MyService {
	/* ... */
}

// web.ts
export function createMyServiceWeb(): MyService {
	/* ... */
}

// 3. Export with platform detection
// index.ts
export const MyServiceLive = window.__TAURI_INTERNALS__
	? createMyServiceDesktop()
	: createMyServiceWeb();

// 4. Add to main export
// services/index.ts
export { MyServiceLive as myService } from './my-service';
```

## Services vs Query Layer

| Aspect             | Services              | Query Layer            |
| ------------------ | --------------------- | ---------------------- |
| **State**          | Stateless             | Stateful (cache)       |
| **Dependencies**   | Explicit parameters   | Settings, stores       |
| **Error Handling** | Result types          | Result + UI toasts     |
| **Usage**          | Direct function calls | TanStack Query         |
| **Reactivity**     | None                  | Reactive subscriptions |

Services provide pure business logic. The query layer adds caching, reactivity, and UI integration.
