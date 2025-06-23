# Settings Components

This folder contains all components that are directly bound to the global settings store. These components encapsulate settings management logic and provide reusable UI elements for configuring various aspects of the application.

## Purpose

Components in this directory:

- Import and use the global `settings` store from `$lib/stores/settings.svelte`
- Either take **no props** or only take a **`settingsKey` prop** to determine which setting to bind to
- Update settings directly using `settings.value = {...settings.value, ...}`
- Are self-contained and can be used globally throughout the application

## Criteria for Inclusion

A component belongs here if it meets ALL of the following criteria:

1. **Directly bound to settings**: The component imports and uses `settings` from `$lib/stores/settings.svelte`
2. **Minimal props**: Takes either no props OR only a `settingsKey` prop (no value/onChange props)
3. **Self-contained**: All state management is handled internally via the settings store
4. **Reusable**: Can be dropped into any part of the app without additional setup

## Component Organization

```
settings/
├── api-key-inputs/         # API key input components
│   ├── OpenAiApiKeyInput.svelte
│   ├── GroqApiKeyInput.svelte
│   ├── AnthropicApiKeyInput.svelte
│   ├── ElevenLabsApiKeyInput.svelte
│   └── GoogleApiKeyInput.svelte
├── selectors/             # Various selector components
│   ├── DeviceSelector.svelte
│   ├── TransformationSelector.svelte
│   └── TranscriptionSelector.svelte
├── index.ts               # Re-exports all components
└── README.md             # This file
```

## Usage Examples

### Basic Usage (No Props)

```svelte
<script>
	import { OpenAiApiKeyInput } from '$lib/components/settings';
</script>

<OpenAiApiKeyInput />
```

### With Settings Key Prop

```svelte
<script>
	import { DeviceSelector } from '$lib/components/settings';
</script>

<!-- For VAD recording device -->
<DeviceSelector settingsKey="vadRecorder.recordingDeviceId" />

<!-- For manual recording device -->
<DeviceSelector settingsKey="manualRecorder.recordingDeviceId" />
```

## Creating New Settings Components

When creating a new settings component for this folder:

1. **Import the settings store**:

   ```svelte
   <script lang="ts">
   	import { settings } from '$lib/stores/settings.svelte';
   </script>
   ```

2. **Define props (if needed)**:

   ```svelte
   <script lang="ts">
   	import type { Settings } from '$lib/settings';

   	let { settingsKey }: { settingsKey: keyof Settings } = $props();
   </script>
   ```

3. **Bind to settings**:

   ```svelte
   <Input
   	value={settings.value[settingsKey]}
   	oninput={({ currentTarget: { value } }) => {
   		settings.value = { ...settings.value, [settingsKey]: value };
   	}}
   />
   ```

4. **Export from index.ts**:
   ```ts
   export { default as YourNewComponent } from './YourNewComponent.svelte';
   ```

## Best Practices

1. **Keep components focused**: Each component should manage a single setting or a closely related group of settings
2. **Use descriptive names**: Component names should clearly indicate what setting they manage
3. **Provide helpful UI**: Include labels, descriptions, and validation feedback where appropriate
4. **Handle errors gracefully**: Validate inputs and provide clear error messages
5. **Document special cases**: If a component has unique behavior, document it with comments

## What NOT to Include

Do not add components that:

- Take `value` and `onChange` props (these belong in regular components)
- Require complex external state management
- Are page-specific and not reusable
- Don't interact with the settings store

## Migration Guide

If you're moving an existing component to this folder:

1. Remove any `value` and `onChange` props
2. Import the `settings` store
3. Update bindings to use `settings.value` directly
4. Test that the component still works in all its current usages
5. Update import paths throughout the codebase
