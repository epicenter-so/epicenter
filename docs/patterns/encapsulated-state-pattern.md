# Encapsulated State Pattern

## The Problem

When using reactive state management (like Svelte's `$state` or persisted state utilities), it's tempting to expose the state directly and allow mutations anywhere in the codebase:

```typescript
// The typical approach - directly exposed mutable state
export const settings = createPersistedState({
  key: 'app-settings',
  schema: settingsSchema,
});

// Then anywhere in the codebase...
settings.value = { ...settings.value, theme: 'dark' };
```

This approach has several problems:
- No control over how state is modified
- Difficult to add validation or side effects
- Related logic scattered across the codebase
- No clear API for state mutations
- Hard to track where state changes occur

## The Solution: Encapsulated State with Controlled Access

Instead of exposing mutable state directly, wrap it in an IIFE (Immediately Invoked Function Expression) that returns an object with controlled access methods:

```typescript
export const settings = (() => {
  // Private state - not directly accessible from outside
  const _settings = createPersistedState({
    key: 'app-settings',
    schema: settingsSchema,
  });

  // Return public API
  return {
    // Read-only access to current value
    get value() {
      return _settings.value;
    },

    // Controlled mutation methods
    update(updates: Partial<Settings>) {
      _settings.value = { ..._settings.value, ...updates };
    },

    updateKey<K extends keyof Settings>(key: K, value: Settings[K]) {
      _settings.value = { ..._settings.value, [key]: value };
    },

    // Domain-specific methods
    reset() {
      _settings.value = getDefaultSettings();
    },

    resetShortcuts(type: 'local' | 'global') {
      const defaultSettings = getDefaultSettings();
      const updates = getShortcutUpdates(type, defaultSettings);
      _settings.value = { ..._settings.value, ...updates };
      syncShortcuts(type);
    }
  };
})();
```

## Why This Pattern Works

### 1. Read-Only Access
The `.value` getter provides read-only access to the current state. Components can read state but cannot directly mutate it:

```typescript
// Can read
const theme = settings.value.theme;

// Cannot write (this would fail)
settings.value = { ...settings.value, theme: 'dark' }; // ❌ Cannot assign to read-only property
```

### 2. Controlled Mutations
All state changes must go through defined methods, giving you control over how state is modified:

```typescript
// Single key update
settings.updateKey('theme', 'dark');

// Multiple updates
settings.update({
  theme: 'dark',
  language: 'en'
});
```

### 3. Co-located Logic
Related functionality lives with the state it operates on. If you have multiple places that need to reset settings, that logic belongs with the settings object:

```typescript
// Instead of this scattered across multiple files:
function resetSettingsInComponent() {
  settings.value = getDefaultSettings();
}

// You have this co-located with the state:
settings.reset();
```

### 4. Clear API Surface
The object exposes exactly what operations are allowed on the state. This makes the codebase more maintainable and self-documenting:

```typescript
settings.value;        // Read current settings
settings.update();     // Update multiple settings
settings.updateKey();  // Update single setting
settings.reset();      // Reset to defaults
settings.resetShortcuts(); // Reset shortcuts
```

## When to Use This Pattern

This pattern is particularly useful when:

1. **Multiple components modify the same state** - Centralizes mutation logic
2. **State changes trigger side effects** - Easy to add validation, logging, or sync operations
3. **Complex state operations exist** - Methods like `reset()` or `migrate()` belong with the state
4. **You want better debugging** - All mutations go through defined methods you can log or breakpoint
5. **Type safety is important** - Methods can enforce proper types better than spread operations

## Implementation Tips

### 1. Keep Methods Focused
Each method should do one thing well. You might not even want to do a generic `updateKey` or `update` functions, but:

```typescript
// Good - focused methods
settings.updateTheme(theme: Theme) { ... }
settings.updateLanguage(language: Language) { ... }

// Avoid - too generic
settings.updateAnything(key: string, value: any) { ... }
```

### 2. Add Validation When Needed
The encapsulation makes it easy to add validation:

```typescript
updateBitrate(bitrate: number) {
  if (bitrate < 64 || bitrate > 320) {
    // Handle error, maybe display a toast
    return;
  }
  _settings.value = { ..._settings.value, bitrate };
}
```

### 3. Handle Side Effects
Co-locate side effects with state changes:

```typescript
async updateApiKey(service: string, key: string) {
  // Validate the key first
  const isValid = await validateApiKey(service, key);
  if (!isValid) {
    throw new Error('Invalid API key');
  }
  
  // Update state
  _settings.value = { ..._settings.value, [`apiKeys.${service}`]: key };
  
  // Trigger side effect
  await reconnectService(service);
}
```

### 4. Consider Computed Properties
Add computed getters for derived state:

```typescript
return {
  get value() { return _settings.value; },
  
  // Computed property
  get isConfigured() {
    return Boolean(_settings.value.apiKey && _settings.value.endpoint);
  },
  
  // Methods...
}
```

## Comparison with OOP

This pattern shares some similarities with object-oriented programming but remains functional:

- **Like OOP**: Encapsulation, methods operating on internal state
- **Unlike OOP**: No classes, no inheritance, no `this` context
- **Better than OOP for this use case**: Simpler, no constructor complexity, works well with reactive systems

## Summary

The encapsulated state pattern provides a clean, controlled interface for state management. By wrapping state in an IIFE and exposing only specific methods, you get:

- **Data integrity** through controlled mutations
- **Better organization** with co-located logic
- **Easier maintenance** with a clear API
- **Future flexibility** to add validation or side effects
- **Type safety** with well-defined method signatures

This pattern works particularly well with reactive state systems like Svelte's stores or Vue's refs, where you want the reactivity benefits but need more control over mutations.