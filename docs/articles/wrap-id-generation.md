# Wrap your ID generators to include assertions in the definition instead of everywhere they're called, not just for types but for sanity

I was generating IDs throughout a codebase and noticed this pattern:

```typescript
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

// In one file
const sessionId = nanoid() as SessionID;

// In another file  
const recordingId = nanoid() as RecordingID;

// Yet another place
const userId = nanoid() as UserID;
```

Same ID generation logic. Same alphabet. Same length. Scattered everywhere with different type assertions.

Here's what I realized: I wasn't just repeating the type assertion. I was repeating the entire decision about how IDs should be generated.

## Instead, fix and wrap with specific generators

Create a generator function for each ID type:

```typescript
import { customAlphabet } from 'nanoid';
import type { Brand } from 'wellcrafted';

type SessionID = string & Brand<'SessionID'>;
type RecordingID = string & Brand<'RecordingID'>;
type UserID = string & Brand<'UserID'>;

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

export const generateSessionId = (): SessionID => 
    nanoid() as SessionID;

export const generateRecordingId = (): RecordingID => 
    nanoid() as RecordingID;

export const generateUserId = (): UserID => 
    nanoid() as UserID;
```

Now everywhere else:

```typescript
const sessionId = generateSessionId();
const recordingId = generateRecordingId();  
const userId = generateUserId();
```

No imports. No configuration. No type assertions. Each function returns the exact type you need.

## Why this matters more than you think

The obvious win: you've centralized your ID generation strategy. Want to change the alphabet? One place. Want longer IDs? One place. Want to switch from nanoid to uuid? One place.

But here's what I didn't expect: it made me think about IDs differently.

When you import nanoid everywhere, each usage feels independent. "I need an ID here, let me generate one." You don't think about consistency.

When you have `generateSessionId()`, `generateRecordingId()`, you're using your app's ID system. It's intentional. The type safety is built in. You can't accidentally use a SessionID where a RecordingID belongs.

## Take it further: different strategies per type

Once you have the pattern, you can customize each generator:

```typescript
const shortId = customAlphabet('0123456789ABCDEF', 6);
const longId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 16);
const standardId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

// Sessions need longer IDs for security
export const generateSessionId = (): SessionID => 
    longId() as SessionID;

// Recordings use standard length
export const generateRecordingId = (): RecordingID => 
    standardId() as RecordingID;

// Temp IDs can be shorter
export const generateTempId = (): TempID => 
    shortId() as TempID;
```

Now each ID type can have its own generation strategy. The function name tells you exactly what you're creating.

## The real insight

This isn't about nanoid or even IDs specifically. It's about wrapping external libraries at the point where they touch your domain.

Don't scatter `customAlphabet()` calls throughout your code. Don't make every file decide how IDs should look. Create specific functions that say "this is how we generate SessionIDs" and "this is how we generate UserIDs."

The wrapper isn't just about the type assertion. It's about making invalid states impossible. You literally can't pass a SessionID where a UserID is expected.

Your code becomes cleaner. Your IDs become consistent. And when you need to debug why that one ID looks weird, you know exactly where it came from.