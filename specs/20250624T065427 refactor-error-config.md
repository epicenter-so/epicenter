# Refactor Error Config to Error Title

## Problem
The `createWhisperService` function accepts an `errorConfig` object with `title` and `description` properties, but only `errorConfig.title` is actually used in the code. The `description` property is never referenced, making it unnecessary overhead.

## Solution
Flatten the `errorConfig` object to a simple string parameter called `errorTitle` since that's all that's being used.

## Todo List
- [x] Refactor errorConfig to be a simple string (errorTitle) in createWhisperService
- [x] Update openai.ts to pass errorTitle instead of errorConfig
- [x] Update groq.ts to pass errorTitle instead of errorConfig  
- [x] Update fasterWhisperServer.ts to pass errorTitle instead of errorConfig

## Implementation Details
1. Change the parameter from `errorConfig: { title: string; description: string }` to `errorTitle: string`
2. Update line 208 to use `errorTitle` directly instead of `errorConfig.title`
3. Update all three service implementations to pass just the title string

## Review
Successfully refactored the error configuration from an object with unused `description` property to a simple `errorTitle` string parameter. This simplifies the API and removes unnecessary code. All three service implementations have been updated to use the new parameter name.