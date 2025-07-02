# Discriminated Union Improvements for Transformation Runs

## Overview

This document describes the improvements made to the discriminated union implementation for transformation runs and transformation step runs in the Whispering application. The changes enhance type safety, remove redundancy, and follow TypeScript best practices.

## Changes Made

### 1. Removed Unnecessary null Fields

**Before:**
```typescript
export type TransformationRunCompleted = BaseTransformationRun & {
  status: 'completed';
  output: string;
  error: null;  // Unnecessary!
};

export type TransformationRunFailed = BaseTransformationRun & {
  status: 'failed';
  output: null;  // Unnecessary!
  error: string;
};
```

**After:**
```typescript
export type TransformationRunCompleted = BaseTransformationRun & {
  status: 'completed';
  output: string;
};

export type TransformationRunFailed = BaseTransformationRun & {
  status: 'failed';
  error: string;
};
```

**Rationale:** The `null` fields were redundant. TypeScript's discriminated unions already ensure that when `status === 'completed'`, the type is narrowed to `TransformationRunCompleted` which doesn't have an `error` field. Similarly, when `status === 'failed'`, the type is narrowed to `TransformationRunFailed` which doesn't have an `output` field.

### 2. Created Discriminated Union for TransformationStepRun

**Before:**
```typescript
stepRuns: {
  id: string;
  stepId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  input: string;
}[];
```

**After:**
```typescript
type BaseTransformationStepRun = {
  id: string;
  stepId: string;
  startedAt: string;
  completedAt: string | null;
  input: string;
};

export type TransformationStepRunRunning = BaseTransformationStepRun & {
  status: 'running';
};

export type TransformationStepRunCompleted = BaseTransformationStepRun & {
  status: 'completed';
  output: string;
};

export type TransformationStepRunFailed = BaseTransformationStepRun & {
  status: 'failed';
  error: string;
};

export type TransformationStepRun =
  | TransformationStepRunRunning
  | TransformationStepRunCompleted
  | TransformationStepRunFailed;
```

**Benefits:**
- Step runs can now track their individual outputs and errors
- Type safety when accessing step run results
- Consistent pattern with transformation runs

### 3. Added Type Guard Functions

```typescript
// Type guards for TransformationRun
export function isTransformationRunCompleted(
  run: TransformationRun,
): run is TransformationRunCompleted {
  return run.status === 'completed';
}

export function isTransformationRunFailed(
  run: TransformationRun,
): run is TransformationRunFailed {
  return run.status === 'failed';
}

export function isTransformationRunRunning(
  run: TransformationRun,
): run is TransformationRunRunning {
  return run.status === 'running';
}

// Type guards for TransformationStepRun
export function isTransformationStepRunCompleted(
  stepRun: TransformationStepRun,
): stepRun is TransformationStepRunCompleted {
  return stepRun.status === 'completed';
}

export function isTransformationStepRunFailed(
  stepRun: TransformationStepRun,
): stepRun is TransformationStepRunFailed {
  return stepRun.status === 'failed';
}

export function isTransformationStepRunRunning(
  stepRun: TransformationStepRun,
): stepRun is TransformationStepRunRunning {
  return stepRun.status === 'running';
}
```

**Usage Example:**
```typescript
if (isTransformationRunCompleted(run)) {
  // TypeScript knows run.output exists and is a string
  console.log(run.output);
}

if (isTransformationRunFailed(run)) {
  // TypeScript knows run.error exists and is a string
  console.error(run.error);
}
```

## Database Service Updates: From .modify() to .put()

### Understanding Dexie's .put() Method

The `.put()` method in Dexie performs an "upsert" operation:
- If a record with the same primary key exists, it replaces the entire record
- If no record exists, it inserts a new record
- It requires a complete object, ensuring type safety

### Why We Switched from .modify()

**Problems with .modify():**
1. Encourages mutations that bypass TypeScript's type system
2. Requires type assertions when changing discriminated union variants
3. Can lead to runtime errors if mutations create invalid states

**Before (using .modify() with mutations):**
```typescript
async markTransformationRunAsCompleted({ transformationRun, output }) {
  const markTransformationRunAsCompleted = (
    transformationRun: TransformationRun,
  ) => {
    const now = new Date().toISOString();
    transformationRun.status = 'completed';  // Mutation!
    transformationRun.completedAt = now;
    (transformationRun as TransformationRunCompleted).output = output;  // Type assertion!
  };
  
  await db.transformationRuns
    .where('id')
    .equals(transformationRun.id)
    .modify(markTransformationRunAsCompleted);
    
  // More mutations to keep in-memory object in sync
  markTransformationRunAsCompleted(transformationRun);
  return Ok(transformationRun);  // Type is still generic TransformationRun
}
```

**After (using .put() with immutable updates):**
```typescript
async markTransformationRunAsCompleted({ 
  transformationRun, 
  output 
}): Promise<Result<TransformationRunCompleted, DbServiceError>> {
  const now = new Date().toISOString();
  
  // Create a new object with the correct type
  const completedRun: TransformationRunCompleted = {
    ...transformationRun,
    status: 'completed',
    completedAt: now,
    output,
  };
  
  const { error } = await tryAsync({
    try: () => db.transformationRuns.put(completedRun),
    mapError: (error): DbServiceError => ({
      name: 'DbServiceError',
      message: 'Error updating transformation run as completed in Dexie',
      context: { transformationRun, output },
      cause: error,
    }),
  });
  
  if (error) return Err(error);
  return Ok(completedRun);  // Type is specific: TransformationRunCompleted
}
```

### Benefits of the New Approach

1. **Type Safety**: TypeScript validates the entire object structure at compile time
2. **Immutability**: No mutations mean no unexpected side effects
3. **Cleaner Code**: No need for separate modification functions or type assertions
4. **Better Return Types**: Methods return specific types (e.g., `TransformationRunCompleted`) instead of generic ones
5. **Easier Testing**: Pure functions that create new objects are easier to test

## Example: Complete Flow

Here's how the improved types work together in practice:

```typescript
// 1. Create a new transformation run (status: 'running')
const newRun = await db.createTransformationRun({
  transformationId: 'trans-123',
  recordingId: 'rec-456',
  input: 'Hello world',
});

// 2. Add a step run (status: 'running')
const stepRun = await db.addTransformationStepRunToTransformationRun({
  transformationRun: newRun,
  stepId: 'step-1',
  input: 'Hello world',
});

// 3. Complete the step run with output
const updatedRun = await db.markTransformationRunStepAsCompleted({
  transformationRun: newRun,
  stepRunId: stepRun.id,
  output: 'Processed: Hello world',
});

// 4. Complete the entire transformation run
const completedRun = await db.markTransformationRunAsCompleted({
  transformationRun: updatedRun,
  output: 'Final output: Hello world',
});

// TypeScript knows completedRun.output exists!
console.log(completedRun.output);
```

## Migration Considerations

The changes are backward compatible at the runtime level because:
1. We only removed fields that were always `null`
2. The discriminated union structure remains the same
3. Existing status checks continue to work

However, any code that explicitly checked for `error === null` or `output === null` should be updated to use the type guards or status checks instead.

## Best Practices Going Forward

1. **Always use type guards** when narrowing transformation run types
2. **Create new objects** instead of mutating existing ones
3. **Use specific return types** in function signatures
4. **Leverage the discriminated union** to ensure exhaustive handling of all states
5. **Avoid type assertions** - if you need one, consider if the types need improvement

## Conclusion

These improvements make the codebase more maintainable, type-safe, and easier to reason about. The discriminated unions now properly model the domain without redundancy, and the database operations maintain type safety throughout the entire flow.