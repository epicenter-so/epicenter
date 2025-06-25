# Consolidated Settings Migration Plan

## Goal
Replace the chained settings stores (settingsV1 through settingsV7) with a single `createPersistedState` call that handles all migrations in the `onParseError` callback.

## Implementation Strategy

### 1. Create a unified migration handler
- In `onParseError`, check the error type
- For `schema_validation_failed`, use the value from the error to attempt migration
- Try to detect which version the data is by checking against schemas
- Apply migrations sequentially from detected version to current version

### 2. Handle special cases
- Empty storage: Return fully migrated default settings
- JSON parse error: Return fully migrated default settings
- Unknown version: Attempt to spread onto defaults and migrate

### 3. Benefits
- Single source of truth for settings
- No intermediate stores needed
- All migration logic in one place
- Better handling of partial/corrupted data

## TODO Items
- [x] Create a new migration strategy that handles all versions in onParseError
- [x] Implement logic to detect which version the stored data is
- [x] Chain migrations in the correct order based on detected version
- [x] Handle spreading existing values onto defaults during migration

## Review

### Changes Made
1. **Replaced chained stores with single settings store**: Removed intermediate `settingsV1` through `settingsV6` stores and consolidated all migration logic into a single `createPersistedState` call.

2. **Created `migrateSettings` function**: This function detects which version the stored data is by attempting to parse it against each schema (from newest to oldest) and applies the appropriate migration chain.

3. **Enhanced error handling in `onParseError`**:
   - `storage_empty`: Returns fully migrated default settings
   - `json_parse_error`: Logs error and returns fully migrated defaults
   - `schema_validation_failed`: Attempts to detect version and migrate the value
   - `schema_validation_async_during_sync`: Handles unexpected async validation
   - Fallback: Returns fully migrated defaults

4. **Preserved existing values**: When no schema matches, the function spreads the unknown value onto default settings before running through the full migration chain, ensuring partial data is preserved where possible.

### Benefits
- **Simpler API**: Only one settings store exported instead of multiple versions
- **Better error recovery**: Handles corrupted or partial data gracefully
- **Clearer migration path**: All migration logic is in one place
- **Type safety**: Maintains full TypeScript type safety throughout
- **Performance**: No unnecessary intermediate store creations