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

## Detailed Structure Breakdown

### `app/` - Application Configuration
Core application settings that affect the entire system.
- **urls.ts**: Base URLs, API endpoints, route paths
- **timing.ts**: Delays, timeouts, debounce values

### `audio/` - Audio System
Everything related to audio capture and processing.
- **bitrate.ts**: Audio quality settings and options
- **recording-modes.ts**: Different recording triggers (manual, voice-activated)
- **recording-states.ts**: State machine definitions for recording flow
- **media-constraints.ts**: WebRTC and media API configurations

### `keyboard/` - Input System
Comprehensive keyboard handling for shortcuts and hotkeys.
- **accelerator-possible-keys.ts**: All valid Electron accelerator keys
- **accelerator-supported-keys.ts**: Curated subset for the application
- **keyboard-event-possible-keys.ts**: Browser KeyboardEvent key values
- **keyboard-event-supported-keys.ts**: Application-supported key combinations
- **macos-option-key-map.ts**: Special handling for macOS Option key
- **modifiers.ts**: Cross-platform modifier key mappings

### `platform/` - System Dependencies
Constants that depend on or describe the operating system.
- **is-macos.ts**: Platform detection (depends on `OsService`)

### `transcription/` & `inference/` - AI Services
Configuration for external AI services, separated by purpose.
- Model definitions, service endpoints, rate limits
- Organized by provider (OpenAI, Groq, etc.)

## Dependencies on Other Systems

Some constants have dependencies on other parts of the codebase:

### Platform Constants
The `platform/is-macos.ts` constant depends on the `OsService`:
```typescript
import { OsServiceLive } from '$lib/services/OsService';
export const IS_MACOS = OsServiceLive.type() === 'Darwin';
```

This is intentional as platform detection requires runtime service calls. The constant caches this value for performance.

### Service Limits
Constants like `MAX_FILE_SIZE_MB` in `transcription/limits.ts` are extracted from service implementations to:
- Prevent duplication across multiple services
- Enable UI components to validate before service calls
- Maintain consistency across providers

## Import Guidelines

### Preferred: Direct Imports
```typescript
import { WHISPERING_URL } from '$lib/constants/app/urls';
import { DEFAULT_BITRATE_KBPS } from '$lib/constants/audio/bitrate';
```

Use direct imports for:
- Single constant usage
- Clear dependency tracking
- Optimal bundle size

### Alternative: Category Imports
```typescript
import * as AudioConstants from '$lib/constants/audio';

// When working extensively with audio features
const bitrate = AudioConstants.DEFAULT_BITRATE_KBPS;
const constraints = AudioConstants.WHISPER_CONSTRAINTS;
```

Use category imports when:
- Using multiple constants from same domain
- Building domain-specific features
- Creating higher-level abstractions

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

// In transcription/index.ts
export * from './newprovider-models';
```

## Best Practices

1. **Naming Convention**: Use UPPER_SNAKE_CASE for constant values
2. **Type Safety**: Always use `as const` for literal values
3. **Documentation**: Document sources for external values (API docs, specifications)
4. **Avoid Logic**: Constants should be pure data, no computed values
5. **Group Related Values**: Use objects for related constants that are always used together

## Migration Notes

When migrating from the old structure:
1. Service-specific implementation details remain in service files
2. Shared constants move to this directory
3. Update imports incrementally, testing as you go
4. Use find-and-replace carefully, verifying each change

## Questions?

If you're unsure where a constant belongs:
1. Consider who uses it (single service vs. multiple consumers)
2. Think about the domain it represents
3. Check similar constants for patterns
4. When in doubt, choose the most specific category