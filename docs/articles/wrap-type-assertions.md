# Wrap your TypeScript type assertions, especially if reused

I was reviewing some TypeScript code and kept seeing this pattern:

```typescript
const deviceId = localStorage.getItem('deviceId') as DeviceIdentifier;
// ... 200 lines later
const selectedDevice = event.target.value as DeviceIdentifier;
// ... in another file
const defaultDevice = config.device as DeviceIdentifier;
```

Same unsafe cast. Scattered everywhere. No context about why it's safe.

Here's what I realized: every `as` assertion is a lie you're telling TypeScript. And if you're going to lie, at least put it in one place with a good explanation.

## The pattern that actually helps

Instead of sprinkling `as DeviceIdentifier` throughout your code, wrap it:

```typescript
/**
 * Type guard to convert a string to DeviceIdentifier
 * Use this when receiving device identifiers from external sources
 */
export function asDeviceIdentifier(value: string): DeviceIdentifier {
    return value as DeviceIdentifier;
}
```

Now your code becomes:

```typescript
const deviceId = asDeviceIdentifier(localStorage.getItem('deviceId') ?? '');
const selectedDevice = asDeviceIdentifier(event.target.value);
const defaultDevice = asDeviceIdentifier(config.device);
```

## Why this is so much better

First, the obvious wins. You can find every place you're making this assertion by searching for `asDeviceIdentifier`. You can add validation later without touching 20 files. The JSDoc comment explains the context.

But here's the real insight: it changes how you think about the assertion.

When you write `value as DeviceIdentifier`, you're making a quick decision. It's easy. Too easy.

When you write `asDeviceIdentifier(value)`, you're calling a function. That function has a name. That name has meaning. You have to think: "Am I converting something to a DeviceIdentifier here? Is this the right pattern?"

## Take it further: add runtime validation

Once you have the wrapper, you can evolve it:

```typescript
export function asDeviceIdentifier(value: string): DeviceIdentifier {
    // Could add validation in dev mode
    if (process.env.NODE_ENV === 'development') {
        if (!value || typeof value !== 'string') {
            console.warn('Invalid DeviceIdentifier:', value);
        }
    }
    return value as DeviceIdentifier;
}
```

Or even better, make it a proper type guard:

```typescript
export function isDeviceIdentifier(value: unknown): value is DeviceIdentifier {
    return typeof value === 'string' && value.length > 0;
}

export function asDeviceIdentifier(value: unknown): DeviceIdentifier {
    if (!isDeviceIdentifier(value)) {
        throw new Error(`Invalid DeviceIdentifier: ${value}`);
    }
    return value;
}
```

Now it's not even a lie anymore. It's validated.

## The lesson

Every reused `as` assertion should be a function. Name it. Document it. Make the unsafe operation visible and intentional.

Your future self will thank you when you're debugging why a DeviceIdentifier is somehow `undefined` in production. At least you'll know exactly where to look.