# Constants Directory

## Purpose

The `constants` directory serves as the centralized source of truth for all immutable values used throughout the Whispering application. This includes configuration values, enumerations, type definitions, and any other values that remain constant during runtime.

## Organization Philosophy

Constants are organized by **domain** rather than by technical type. This approach prioritizes developer intuition and code maintainability over technical categorization.

### Core Principles

1. **Domain-Driven Structure**: Constants are grouped by their functional area (audio, keyboard, transcription) rather than their type (strings, numbers, objects)
2. **Single Source of Truth**: Each constant is defined in exactly one place
3. **Clear Dependencies**: Constants that depend on services or external systems are clearly documented
4. **Type Safety**: All constants use TypeScript's `as const` assertion for maximum type safety
5. **Progressive Disclosure**: Common constants are easy to find, specialized ones are nested appropriately

## Directory Structure

```
constants/
├── app/                    # Application-wide configuration
├── audio/                  # Audio recording and playback
├── database/               # Database schemas and types
├── inference/              # AI model configurations
├── keyboard/               # Keyboard shortcuts and mappings
├── languages/              # Supported languages and i18n
├── platform/               # Platform-specific constants
├── sounds/                 # Sound effect definitions
├── transcription/          # Speech-to-text services
└── ui/                     # User interface constants
```

## Directory Overview

### `app/` - Application Configuration

Core application settings that affect the entire system, including URLs, API endpoints, and timing configurations.

### `audio/` - Audio System

Everything related to audio capture and processing, including bitrate settings, recording modes, state management, and media constraints.

### `database/` - Database Constants

Database-related constants including transformation types and database schemas.

### `inference/` - AI Model Configuration

Configuration for AI inference services, organized by provider (OpenAI, Groq, Anthropic, Google).

### `keyboard/` - Input System

Comprehensive keyboard handling for shortcuts and hotkeys, supporting both Electron accelerator keys and browser keyboard events.

### `languages/` - Supported Languages

Language constants for internationalization and transcription language options.

### `platform/` - System Dependencies

Platform-specific constants including OS detection.

### `sounds/` - Sound Effects

Sound effect name definitions used throughout the application.

### `transcription/` - Speech-to-Text Services

Configuration for transcription services including model definitions and service-specific settings.

### `ui/` - User Interface Constants

UI-related constants including window behavior options and icon mappings.

## Dependencies on Services

Some constants have dependencies on services. For example, the `platform/is-macos.ts` constant depends on the `OsService`:

```typescript
import { OsServiceLive } from '$lib/services/OsService';
export const IS_MACOS = OsServiceLive.type() === 'Darwin';
```

Because OsServiceLive.type() remains stable after build time (services are injected conditionally based on `window.__TAURI_INTERNALS__`, which is available at build time), the constant caches this value for performance.

## Import and Export Patterns

### Why We Use Barrel Files

The barrel file acts as a curated public API, making it clear what's intended for external use.

When we move types or functions between files within a barrel, we only update the barrel export rather than changing imports across the entire codebase.

In other words, internal reorganization doesn't break imports.

### How We Export Constants

Each category folder has an `index.ts` barrel file that uses **explicit exports**:

```typescript
// ✅ Good - Explicit exports in barrel files
export { WHISPERING_URL, WHISPERING_RECORDINGS_PATHNAME } from './urls';
export { DEBOUNCE_TIME_MS } from './timing';
```

We avoid wildcard exports:

```typescript
// ❌ Bad - Don't use wildcards
export * from './urls';
```

We do this to mitigate the potential performance downsides/overhead of barrelling (bundlers would have harder time analyzing wildcard exports).

### How We Import Constants

Always import from the category barrel, not the individual files:

```typescript
// ✅ Good - Import from category barrels
import { WHISPERING_URL } from '$lib/constants/app';
import { DEFAULT_BITRATE_KBPS, RECORDING_MODES } from '$lib/constants/audio';
import { IS_MACOS } from '$lib/constants/platform';
```

Don't import from the actual source files:

```typescript
// ❌ Bad - Don't bypass the barrel
import { WHISPERING_URL } from '$lib/constants/app/urls';
import { DEFAULT_BITRATE_KBPS } from '$lib/constants/audio/bitrate';
```

## Adding New Constants

When adding new constants:

1. **Determine the Domain**: Which functional area does this constant belong to?
2. **Check for Existing Files**: Can it fit in an existing file within that domain?
3. **Create New File if Needed**: Use clear, descriptive names
4. **Add Type Annotations**: Use `as const` and explicit types
5. **Document Complex Constants**: Add JSDoc comments for non-obvious values
6. **Update Index Files**: Ensure new constants are properly exported

### Example: Adding a New Transcription Provider

```typescript
// In transcription/newprovider-models.ts
/**
 * Available models for NewProvider transcription service
 * @see https://newprovider.com/docs/models
 */
export const NEWPROVIDER_MODELS = [
	'fast-whisper-v1',
	'accurate-whisper-v2',
] as const;

export type NewProviderModel = (typeof NEWPROVIDER_MODELS)[number];

// In transcription/index.ts - use explicit exports
export {
	NEWPROVIDER_MODELS,
	type NewProviderModel,
} from './newprovider-models';
```

## Best Practices

1. Naming Convention: Use UPPER_SNAKE_CASE for constant values
2. Type Safety: Always use `as const` for literal values
3. Documentation: Document sources for external values (API docs, specifications)
4. Avoid Logic: Constants should be pure data, no computed values
5. Group Related Values: Use objects for related constants that are always used together

If you're unsure where a constant belongs:

1. Consider who uses it (single service vs. multiple consumers)
2. Think about the domain it represents
3. Check similar constants for patterns
4. When in doubt, choose the most specific category
