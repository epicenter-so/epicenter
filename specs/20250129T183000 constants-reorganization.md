# Constants Reorganization Spec

## Current Issues

1. **Mixed organization**: Some constants in a folder, others in a single large file
2. **Unclear boundaries**: Constants folder contains only keyboard-related items
3. **Large monolithic file**: constants.ts has 438 lines mixing many different concerns
4. **Duplicated constants**: Some constants (like MAX_FILE_SIZE_MB) are duplicated across service files
5. **No clear categorization**: Constants are mixed without clear grouping

## Analysis of Current Constants

### In constants folder (all keyboard-related):
- `accelerator-possible-keys.ts` - All possible Electron accelerator keys
- `accelerator-supported-keys.ts` - Curated subset for the app
- `is-macos.ts` - Platform detection
- `keyboard-event-possible-keys.ts` - All possible KeyboardEvent.key values
- `keyboard-event-supported-keys.ts` - Curated subset for shortcuts
- `macos-option-key-map.ts` - macOS-specific key normalization
- `modifiers.ts` - Platform-specific modifier keys

### In constants.ts (mixed concerns):
1. **App Configuration** - URLs, pathnames, timing
2. **Audio/Recording** - Bitrates, recording modes, states
3. **UI/Display** - Always on top, state icons
4. **Languages** - Supported languages and labels
5. **Transcription Services** - Models, service configs
6. **AI/Inference** - Provider models
7. **Sounds** - Sound effect names

### In service files:
- File size limits, database names, timeouts (service-specific)

## Proposed Folder Structure

```
src/lib/constants/
├── index.ts                    # Re-exports all constants
├── app/                        # App-level configuration
│   ├── index.ts
│   ├── urls.ts                 # WHISPERING_URL, pathnames
│   └── timing.ts               # DEBOUNCE_TIME_MS, etc.
├── audio/                      # Audio/recording related
│   ├── index.ts
│   ├── bitrate.ts              # Bitrate values and options
│   ├── recording-modes.ts      # Recording modes and options
│   ├── recording-states.ts     # States, schemas, icons
│   └── media-constraints.ts    # From manual-recorder.ts
├── keyboard/                   # All keyboard-related (current folder contents)
│   ├── index.ts
│   ├── accelerator-possible-keys.ts
│   ├── accelerator-supported-keys.ts
│   ├── keyboard-event-possible-keys.ts
│   ├── keyboard-event-supported-keys.ts
│   ├── macos-option-key-map.ts
│   └── modifiers.ts
├── platform/                   # Platform-specific
│   ├── index.ts
│   └── is-macos.ts            # Move from keyboard folder
├── ui/                         # UI-related constants
│   ├── index.ts
│   ├── always-on-top.ts       # Always on top options
│   └── icons.ts               # State to icon mappings
├── languages/                  # Language support
│   ├── index.ts
│   └── supported-languages.ts  # Languages and labels
├── transcription/             # Transcription services
│   ├── index.ts
│   ├── service-config.ts      # Service definitions
│   ├── openai-models.ts       # OpenAI specific models
│   ├── groq-models.ts         # Groq specific models  
│   ├── elevenlabs-models.ts   # ElevenLabs specific models
│   └── limits.ts              # MAX_FILE_SIZE_MB, etc.
├── inference/                 # AI inference providers
│   ├── index.ts
│   ├── providers.ts           # Provider list and options
│   ├── openai-models.ts       # OpenAI inference models
│   ├── groq-models.ts         # Groq inference models
│   ├── anthropic-models.ts   # Anthropic models
│   └── google-models.ts       # Google models
├── sounds/                    # Sound effect names
│   ├── index.ts
│   └── sound-names.ts         # WhisperingSoundNames
└── database/                  # Database constants
    ├── index.ts
    └── transformation-types.ts # From services/db/models.ts

```

## Implementation Plan

### Phase 1: Create folder structure
- [ ] Create all folders without underscore prefix
- [ ] Create index.ts files for each folder

### Phase 2: Extract and organize constants
- [ ] Move keyboard constants to keyboard/
- [ ] Split constants.ts into appropriate folders
- [ ] Extract service-specific constants that should be shared

### Phase 3: Update imports
- [ ] Update all imports to use new paths
- [ ] Ensure all constants are properly typed with `as const`

### Phase 4: Create root index.ts
- [ ] Export all constants with proper namespacing
- [ ] Allow both direct imports and namespace imports

## Benefits

1. **Clear organization**: Each folder has a single responsibility
2. **Better discoverability**: Developers can easily find constants
3. **Reduced file size**: No more 400+ line constants file
4. **Type safety**: Each constant file focuses on its domain
5. **Scalability**: Easy to add new constant categories
6. **Import flexibility**: Can import specific constants or entire categories

## Import Strategy Comparison

### 1. Direct Imports
```typescript
// Import specific constants directly from their files
import { WHISPERING_URL, WHISPERING_URL_WILDCARD } from '$lib/constants/app/urls';
import { BITRATE_OPTIONS, DEFAULT_BITRATE_KBPS } from '$lib/constants/audio/bitrate';
import { ACCELERATOR_SECTIONS } from '$lib/constants/keyboard/accelerator-supported-keys';

// Usage
const apiUrl = `${WHISPERING_URL}/api`;
const currentBitrate = DEFAULT_BITRATE_KBPS;
```

**Pros:**
- Most explicit and clear about dependencies
- Best tree-shaking potential
- IDE can directly navigate to source
- No risk of circular dependencies

**Cons:**
- Verbose import statements
- Must know exact file location
- Multiple imports from same category require multiple lines

### 2. Category Imports (Namespace Pattern)
```typescript
// Import entire category as namespace
import * as AppConstants from '$lib/constants/app';
import * as AudioConstants from '$lib/constants/audio';
import * as KeyboardConstants from '$lib/constants/keyboard';

// Usage
const apiUrl = `${AppConstants.WHISPERING_URL}/api`;
const bitrate = AudioConstants.DEFAULT_BITRATE_KBPS;
const keys = KeyboardConstants.ACCELERATOR_SECTIONS;
```

**Pros:**
- Clear category boundaries
- Single import per domain
- Good for related constants used together
- Namespace prevents naming conflicts

**Cons:**
- Slightly verbose usage (namespace prefix)
- Imports entire category even if only one constant needed
- Requires category index files to be maintained

### 3. Root Re-exports
```typescript
// Import from root constants index
import { 
  WHISPERING_URL,
  BITRATE_OPTIONS,
  ACCELERATOR_SECTIONS,
  IS_MACOS 
} from '$lib/constants';

// Or with namespace
import { App, Audio, Keyboard, Platform } from '$lib/constants';

// Usage
const apiUrl = `${WHISPERING_URL}/api`;
const isMac = IS_MACOS;
```

**Pros:**
- Shortest import path
- Can mix direct and namespace imports
- Single entry point for all constants

**Cons:**
- Root index becomes large and complex
- Higher risk of circular dependencies
- Less clear about constant origins
- All constants loaded into memory

## Recommendation

**Direct imports should be the primary import strategy**, with category imports as a secondary option for closely related constants.

**Rationale:**
1. **Clarity**: Direct imports make dependencies explicit in the code
2. **Performance**: Only imports what's needed, best for tree-shaking
3. **Maintainability**: Easy to find where constants come from
4. **Type Safety**: TypeScript can better track usage and refactoring
5. **Circular Dependency Prevention**: Direct imports minimize risk

**When to use category imports:**
- When using multiple related constants from same domain
- In configuration files that need many constants from one category
- When building higher-level abstractions that work with entire domains

**Avoid root re-exports** except for the most commonly used constants across the entire application. The convenience isn't worth the potential complexity and performance costs.

## Notes

- Folders are not prefixed with underscore for cleaner organization
- Service-specific constants that are truly implementation details stay in service files
- Shared constants (like file size limits) move to constants folder
- Each file should have clear JSDoc comments explaining the constants

## Implementation Summary

### Completed Tasks

1. ✅ Created folder structure without underscore prefixes
2. ✅ Moved all keyboard constants to `keyboard/` folder
3. ✅ Extracted app configuration constants to `app/` folder
4. ✅ Extracted audio/recording constants to `audio/` folder
5. ✅ Extracted UI constants to `ui/` folder
6. ✅ Extracted language constants to `languages/` folder
7. ✅ Extracted transcription service constants to `transcription/` folder
8. ✅ Extracted inference provider constants to `inference/` folder
9. ✅ Extracted sound and database constants to respective folders
10. ✅ Created index.ts files for all folders
11. ✅ Created root index.ts with namespace and direct exports
12. ✅ Updated imports in service files to use new structure
13. ✅ Removed old constants.ts file
14. ✅ Added comprehensive README to constants folder

### Key Changes Made

- **Removed duplicate constants**: MAX_FILE_SIZE_MB now exists in one place
- **Improved organization**: Constants grouped by domain rather than mixed together
- **Added flexibility**: Both direct and namespace imports supported
- **Enhanced documentation**: README explains structure and best practices
- **Updated service files**: All imports now use the new structure