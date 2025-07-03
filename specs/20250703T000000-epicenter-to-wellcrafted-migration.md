# Epic to Wellcrafted Migration - Remaining Files

## Overview
Transform the remaining 35 files that import from '@epicenterhq/result' to use 'wellcrafted/result' and 'wellcrafted/error' instead.

## Transformation Rules
1. Result-related imports (Ok, Err, Result, tryAsync, trySync, resolve, isOk, isErr, isResult, unwrap, partitionResults) → 'wellcrafted/result'
2. Error-related imports (TaggedError, BaseError, extractErrorMessage) → 'wellcrafted/error'
3. Keep the same import style (type imports stay as type imports)

## Files to Transform (35 total)

### Services Layer (22 files)
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/db/dexie.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/clipboard/extension.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/clipboard/desktop.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/clipboard/web.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/vad.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/tray.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/transcription/speaches.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/manual-recorder.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/local-shortcut-manager.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/global-shortcut-manager.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/cpal-recorder.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/completion/openai.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/completion/groq.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/completion/google.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/completion/anthropic.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/http/desktop.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/http/web.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/sound/web.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/sound/desktop.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/notifications/web.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/notifications/desktop.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/download/web.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/services/download/desktop.ts

### Query Layer (7 files)
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/query/vadRecorder.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/query/tray.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/query/transformer.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/query/transformations.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/query/transcription.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/query/sound.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/query/recordings.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/query/download.ts

### UI & Utils (6 files)
- [ ] /Users/braden/Code/whispering/apps/app/src/routes/+layout/AppShell.svelte
- [ ] /Users/braden/Code/whispering/apps/app/src/routes/+layout/registerCommands.svelte.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/utils/createPersistedState.svelte.ts
- [ ] /Users/braden/Code/whispering/apps/app/src/lib/components/UpdateDialog.svelte

## Implementation Plan
1. Process each file individually
2. Read the current import statements
3. Transform according to the rules
4. Update the import statements
5. Mark as complete

## Review

### Transformation Summary
Successfully transformed all 35 remaining files from '@epicenterhq/result' to use 'wellcrafted/result' and 'wellcrafted/error' packages.

### Changes Made
1. **Result-related imports** (Ok, Err, Result, tryAsync, trySync, resolve, isOk, isErr, isResult, unwrap, partitionResults) → moved to 'wellcrafted/result'
2. **Error-related imports** (TaggedError, BaseError, extractErrorMessage) → moved to 'wellcrafted/error'
3. **Import style preserved** - type imports remained as type imports

### Files Transformed by Category

#### Services Layer (23 files)
- ✅ Database service (dexie.ts) - Fixed remaining TaggedError import
- ✅ Clipboard services (extension, desktop, web) 
- ✅ Core services (vad, tray, transcription/speaches, manual-recorder)
- ✅ Recorder services (local-shortcut-manager, global-shortcut-manager, cpal-recorder)
- ✅ Completion services (openai, groq, google, anthropic)
- ✅ HTTP services (desktop, web)
- ✅ Sound services (web, desktop)
- ✅ Notification services (web, desktop)
- ✅ Download services (web, desktop)

#### Query Layer (8 files)
- ✅ vadRecorder.ts
- ✅ tray.ts
- ✅ transformer.ts
- ✅ transformations.ts
- ✅ transcription.ts
- ✅ sound.ts
- ✅ recordings.ts
- ✅ download.ts

#### UI & Utils (4 files)
- ✅ AppShell.svelte
- ✅ registerCommands.svelte.ts
- ✅ createPersistedState.svelte.ts
- ✅ UpdateDialog.svelte

### Key Transformations Applied

#### Example 1: Simple import split
```typescript
// Before:
import { Err, Ok, tryAsync, type TaggedError } from '@epicenterhq/result';

// After:
import { Err, Ok, tryAsync } from 'wellcrafted/result';
import type { TaggedError } from 'wellcrafted/error';
```

#### Example 2: Mixed imports with extractErrorMessage
```typescript
// Before:
import { Err, Ok, extractErrorMessage, tryAsync } from '@epicenterhq/result';

// After:
import { Err, Ok, tryAsync } from 'wellcrafted/result';
import { extractErrorMessage } from 'wellcrafted/error';
```

#### Example 3: Complex imports requiring careful splitting
```typescript
// Before:
import {
    Err,
    extractErrorMessage,
    isErr,
    Ok,
    type Result,
    type TaggedError,
} from '@epicenterhq/result';

// After:
import {
    Err,
    isErr,
    Ok,
    type Result,
} from 'wellcrafted/result';
import type { TaggedError } from 'wellcrafted/error';
import { extractErrorMessage } from 'wellcrafted/error';
```

### Verification
- Final search confirms zero remaining imports from '@epicenterhq/result'
- All 35 identified files have been successfully transformed
- Import style and functionality preserved throughout

### Migration Complete
The codebase has been fully migrated from the '@epicenterhq/result' package to the new 'wellcrafted/result' and 'wellcrafted/error' packages. All imports follow the new structure with result-related functionality imported from 'wellcrafted/result' and error-related functionality imported from 'wellcrafted/error'.