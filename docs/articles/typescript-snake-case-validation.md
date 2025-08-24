# Type-Level Snake Case Validation in TypeScript

I was building a configuration system that needed snake_case keys. I wanted TypeScript to catch typos at compile time, not runtime. Here's what I built:

```typescript
// Define allowed character sets
type LowercaseChar = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';
type NumberChar = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type ValidSnakeCaseChar = LowercaseChar | NumberChar | '_';

// Check for consecutive underscores
type HasConsecutiveUnderscores<S extends string> = 
  S extends `${string}__${string}` ? true : false;

// Check if string ends with underscore
type EndsWithUnderscore<S extends string> = 
  S extends `${string}_` ? true : false;

// Validate each character recursively
type ContainsOnlyValidChars<S extends string> = 
  S extends '' ? true
  : S extends `${infer Head}${infer Tail}`
    ? Head extends ValidSnakeCaseChar
      ? ContainsOnlyValidChars<Tail>
      : false
    : true;

// Main validator with specific error messages
export type ValidateSnakeCase<T extends string> =
  T extends '' ? 'Error: String cannot be empty'
  : T extends `${infer First}${infer Rest}`
    ? First extends LowercaseChar
      ? HasConsecutiveUnderscores<T> extends true
        ? 'Error: String cannot contain consecutive underscores'
        : EndsWithUnderscore<T> extends true
          ? 'Error: String cannot end with an underscore'
          : ContainsOnlyValidChars<T> extends true
            ? T  // Valid!
            : 'Error: String contains invalid characters. Only lowercase letters, numbers, and underscores are allowed'
      : 'Error: String must start with a lowercase letter (a-z)'
    : 'Error: String cannot be empty';

// Usage function
function createKey<T extends string>(key: ValidateSnakeCase<T>): T {
  return key as T;
}

// Examples
const valid = createKey('user_name');        // ✓ Works
const invalid = createKey('HelloWorld');     // ✗ Error: String must start with a lowercase letter (a-z)
```

When you hover over the error, TypeScript shows:
```
Argument of type '"HelloWorld"' is not assignable to parameter of type '"Error: String must start with a lowercase letter (a-z)"'
```

## Breaking Down the Implementation

### Step 1: Define the Alphabet

```typescript
type LowercaseChar = 'a' | 'b' | 'c' | ... | 'z';
type NumberChar = '0' | '1' | '2' | ... | '9';
type ValidSnakeCaseChar = LowercaseChar | NumberChar | '_';
```

We explicitly list every valid character. TypeScript needs to know exactly what's allowed.

### Step 2: Build Validation Rules

Each validation rule is a type that returns `true` or `false`:

```typescript
type HasConsecutiveUnderscores<S extends string> = 
  S extends `${string}__${string}` ? true : false;
```

This checks if the string contains `__` anywhere. The template literal pattern `${string}__${string}` matches any string with two underscores in a row.

```typescript
type ContainsOnlyValidChars<S extends string> = 
  S extends '' ? true
  : S extends `${infer Head}${infer Tail}`
    ? Head extends ValidSnakeCaseChar
      ? ContainsOnlyValidChars<Tail>  // Recursive check
      : false
    : true;
```

This walks through each character recursively. Take the first character (`Head`), check if it's valid, then check the rest (`Tail`).

### Step 3: Combine Rules with Error Messages

The main validator checks each rule in sequence:

```typescript
export type ValidateSnakeCase<T extends string> =
  T extends '' ? 'Error: String cannot be empty'
  : T extends `${infer First}${infer Rest}`
    ? First extends LowercaseChar
      ? HasConsecutiveUnderscores<T> extends true
        ? 'Error: String cannot contain consecutive underscores'
        : EndsWithUnderscore<T> extends true
          ? 'Error: String cannot end with an underscore'
          : ContainsOnlyValidChars<T> extends true
            ? T  // Return the original string if valid
            : 'Error: String contains invalid characters...'
      : 'Error: String must start with a lowercase letter (a-z)'
    : 'Error: String cannot be empty';
```

The order matters. We check the most specific rules first, then fall back to general ones.

## The State Machine Model

Think of this as a state machine:

```
Start → [lowercase] → Loop State
Loop State → [lowercase|number|_] → Loop State  
Loop State → [end] → Accept

Any invalid transition → Error State (with specific message)
```

Each conditional type check represents a state transition. Invalid transitions lead to error states, each with its own message.

## Why the Error Messages Work

Here's the clever part: these "error messages" aren't errors at all. They're just strings.

When validation fails, we return a string like `"Error: String must start with a lowercase letter (a-z)"`. TypeScript then tries to match your input against this string. Since `"HelloWorld"` doesn't equal that error string, TypeScript shows a type error.

The error message you see includes both strings:
- What you provided: `"HelloWorld"`  
- What was expected: `"Error: String must start with a lowercase letter (a-z)"`

### The Quirk That Reveals How It Works

Here's something funny: if you actually pass in the error string itself, it works:

```typescript
// This actually compiles! 
const weird = createKey('Error: String must start with a lowercase letter (a-z)');
```

Why? Because when the validator runs on this string:
1. First character 'E' is uppercase → validation fails
2. Returns the error string: `"Error: String must start with a lowercase letter (a-z)"`
3. TypeScript checks: does the input match the expected type?
4. Input: `"Error: String must start with a lowercase letter (a-z)"`
5. Expected: `"Error: String must start with a lowercase letter (a-z)"`
6. They match! ✓

Of course, nobody would actually type out the full error message as their key. But this quirk shows what's really happening: we're not throwing errors. We're returning strings that describe what went wrong, and TypeScript's type system does the rest.

## Practical Examples

```typescript
// Valid cases
const user = createKey('user_name');           // ✓
const api = createKey('api_key_v2');          // ✓
const retry = createKey('max_retry_count');    // ✓
const single = createKey('a');                 // ✓

// Each invalid case shows a different error
createKey('HelloWorld');    // Error: must start with lowercase
createKey('hello__world');  // Error: no consecutive underscores
createKey('hello_world_');  // Error: cannot end with underscore
createKey('hello world');   // Error: invalid characters (space)
createKey('123_hello');     // Error: must start with lowercase
createKey('');              // Error: cannot be empty
createKey('hello-world');   // Error: invalid characters (hyphen)
```

## The Lesson

TypeScript's type system can implement state machines, validators, even parsers. But the real trick is using descriptive error strings as return types. When validation fails, return a string that explains why. TypeScript will show this in the error message, turning cryptic type errors into helpful guidance.

No runtime overhead. No validation library. Just the compiler catching mistakes before your code runs.