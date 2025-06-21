# Add JSDoc Comments

Add comprehensive JSDoc comments to TypeScript/JavaScript functions, classes, types, and variables.

## Guidelines

### Function Documentation
For each function, include:
1. **Brief description** - Summary of what the function does
2. **Detailed behavior** - Explain the function's logic, side effects, and any important implementation details
3. **Parameters** - Document each parameter with `@param` tags including type and description
4. **Return value** - Document what the function returns with `@returns` tag
5. **Throws** - Document any errors that might be thrown with `@throws` tag
6. **Examples** - Include usage examples with `@example` tag when helpful
7. **Deprecation** - Mark deprecated functions with `@deprecated` tag and suggest alternatives
8. **Since/Version** - Use `@since` tag to indicate when the function was added

### Examples

#### Basic Function
```typescript
/**
 * Calculates the total price including tax.
 * 
 * @param price - The base price of the item
 * @param taxRate - The tax rate as a decimal (e.g., 0.08 for 8%)
 * @returns The total price including tax
 */
function calculateTotal(price: number, taxRate: number): number {
```

#### Async Function with Side Effects
```typescript
/**
 * Synchronizes local keyboard shortcuts with the current settings.
 * 
 * This function iterates through all available commands and either registers
 * or unregisters their keyboard shortcuts based on whether they have key
 * combinations defined in the settings.
 * 
 * @remarks
 * - Registers shortcuts that have key combinations defined in settings
 * - Unregisters shortcuts that don't have key combinations defined
 * - Shows error toast if any registration/unregistration fails
 * 
 * @throws Will show a toast error if any shortcuts fail to register/unregister
 * @returns A promise that resolves when all shortcuts have been synchronized
 */
export async function syncLocalShortcutsWithSettings(): Promise<void> {
```

#### Complex Function with Multiple Parameters
```typescript
/**
 * Transforms audio recording data into the specified output format.
 * 
 * @param audioBuffer - The raw audio buffer to transform
 * @param options - Transformation options
 * @param options.format - The desired output format ('mp3' | 'wav' | 'ogg')
 * @param options.bitrate - The target bitrate in kbps (default: 128)
 * @param options.sampleRate - The target sample rate in Hz (default: 44100)
 * @param callback - Optional callback for progress updates
 * @returns The transformed audio data as a Blob
 * 
 * @example
 * ```typescript
 * const transformed = await transformAudio(buffer, {
 *   format: 'mp3',
 *   bitrate: 192,
 *   sampleRate: 48000
 * }, (progress) => console.log(`${progress}% complete`));
 * ```
 * 
 * @throws {InvalidFormatError} If the specified format is not supported
 * @throws {TransformationError} If the audio transformation fails
 * 
 * @since 2.0.0
 */
async function transformAudio(
  audioBuffer: ArrayBuffer,
  options: TransformOptions,
  callback?: (progress: number) => void
): Promise<Blob> {
```

### Class Documentation
```typescript
/**
 * Manages global keyboard shortcuts for the application.
 * 
 * This class provides a centralized way to register, unregister, and handle
 * global keyboard shortcuts that work across the entire system, even when
 * the application is not in focus.
 * 
 * @remarks
 * Global shortcuts require appropriate system permissions on some platforms.
 * 
 * @example
 * ```typescript
 * const manager = new GlobalShortcutManager();
 * await manager.register('CommandOrControl+Shift+R', () => {
 *   console.log('Shortcut triggered!');
 * });
 * ```
 */
export class GlobalShortcutManager {
  /**
   * Creates a new instance of GlobalShortcutManager.
   * 
   * @param options - Configuration options for the manager
   * @param options.preventDuplicates - Whether to prevent duplicate registrations
   * @param options.logErrors - Whether to log registration errors
   */
  constructor(options?: ManagerOptions) {
```

### Type/Interface Documentation
```typescript
/**
 * Configuration options for keyboard shortcut registration.
 */
export type ShortcutOptions = {
  /** The keyboard combination (e.g., 'Ctrl+Shift+A') */
  keyCombination: string;
  
  /** Human-readable description of what the shortcut does */
  description: string;
  
  /** Whether the shortcut is enabled by default */
  enabled?: boolean;
  
  /** 
   * Priority level for conflict resolution.
   * Higher numbers take precedence.
   * @default 0
   */
  priority?: number;
};
```

### Variable/Constant Documentation
```typescript
/**
 * Default keyboard shortcuts for common application commands.
 * 
 * @remarks
 * These can be overridden by user preferences in settings.
 */
export const DEFAULT_SHORTCUTS: Record<CommandId, string> = {
```

### React/Svelte Component Props
```typescript
/**
 * Props for the ShortcutRecorder component.
 */
type ShortcutRecorderProps = {
  /** Current shortcut value to display */
  value: string;
  
  /** Callback fired when the shortcut changes */
  onChange: (newShortcut: string) => void;
  
  /** Whether the recorder is in recording mode */
  isRecording?: boolean;
  
  /** 
   * Type of shortcut being recorded.
   * - 'local': Only works when app is focused
   * - 'global': Works system-wide
   */
  type: 'local' | 'global';
};
```

## Special Considerations

1. **Svelte-specific**: For Svelte components, document props, events, and slots
2. **TypeScript**: Leverage TypeScript types in JSDoc when in JS files
3. **Internal functions**: Use `@internal` tag for functions not part of public API
4. **Pure functions**: Use `@pure` tag for functions without side effects
5. **Async behavior**: Always document Promise resolution/rejection scenarios
6. **Performance**: Use `@performance` tag to document time/space complexity when relevant

## When NOT to Add JSDoc

- Don't add JSDoc to:
  - Trivial getters/setters with obvious behavior
  - Simple one-line arrow functions with clear names
  - Internal variables with descriptive names
  - Test functions (unless complex test utilities)

## Best Practices

1. Write JSDoc as if explaining to a new developer
2. Focus on the "why" and "how", not just "what"
3. Include edge cases and gotchas
4. Keep descriptions concise but complete
5. Update JSDoc when modifying function behavior
6. Use proper grammar and punctuation
7. Link related functions/types with `@see` tag