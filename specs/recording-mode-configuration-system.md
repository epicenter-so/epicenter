# Recording Mode Configuration System

## Problem Statement

Currently, the recording mode options don't capture which modes should be hidden on non-desktop platforms. The CPAL mode should only be visible when `window.__TAURI_INTERNALS__` is available (desktop), but this logic is scattered in the UI.

## Current State

The `RECORDING_MODE_OPTIONS` in `packages/shared/src/constants.ts` only contains basic display information:

```typescript
export const RECORDING_MODE_OPTIONS = [
  { label: 'Manual', value: 'manual', icon: '🎙️' },
  { label: 'CPAL', value: 'cpal', icon: '🔊' },
  { label: 'Voice Activated', value: 'vad', icon: '🎤' },
  { label: 'Live', value: 'live', icon: '🎬' },
] as const;
```

## Proposed Solution

### 1. Add Desktop-Only Flag

Extend the `RECORDING_MODE_OPTIONS` to include a simple `desktopOnly` boolean:

```typescript
export const RECORDING_MODE_OPTIONS = [
  { label: 'Manual', value: 'manual', icon: '🎙️', desktopOnly: false },
  { label: 'CPAL', value: 'cpal', icon: '🔊', desktopOnly: true },
  { label: 'Voice Activated', value: 'vad', icon: '🎤', desktopOnly: false },
  { label: 'Live', value: 'live', icon: '🎬', desktopOnly: false },
] as const satisfies {
  label: string;
  value: RecordingMode;
  icon: string;
  desktopOnly: boolean;
}[];
```

### 2. Filter Available Modes in Component

Update the `+page.svelte` component to filter the options:

```svelte
<script lang="ts">
  import { RECORDING_MODE_OPTIONS } from '@repo/shared';
  
  // Filter available modes based on platform
  const availableModes = $derived(RECORDING_MODE_OPTIONS.filter(mode => 
    !mode.desktopOnly || window.__TAURI_INTERNALS__
  ));
</script>

<!-- Toggle Group with filtered options -->
<ToggleGroup.Root
  type="single"
  value={settings.value['recording.mode']}
  class="max-w-md w-full grid grid-cols-{availableModes.length} gap-2"
  onValueChange={(mode) => {
    settings.value = {
      ...settings.value,
      'recording.mode': mode as 'manual' | 'cpal' | 'vad' | 'live',
    };
  }}
>
  {#each availableModes as option}
    <ToggleGroup.Item
      value={option.value}
      aria-label={`Switch to ${option.label.toLowerCase()} mode`}
    >
      {option.icon}
      {option.label}
    </ToggleGroup.Item>
  {/each}
</ToggleGroup.Root>
```

## Benefits

1. **Single Source of Truth**: Platform availability defined in the configuration array
2. **Simple Implementation**: Just one boolean flag to control visibility
3. **Automatic Filtering**: Toggle group only shows available modes
4. **Easy to Extend**: Adding desktop-only modes is just setting `desktopOnly: true`

## Implementation Plan

- [ ] Update `RECORDING_MODE_OPTIONS` in `packages/shared/src/constants.ts`
- [ ] Update `+page.svelte` to filter and loop over available modes
- [ ] Test that CPAL is hidden on web and shown on desktop

This approach keeps it simple while making the toggle group truly data-driven based on platform availability.