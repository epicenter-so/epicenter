# Vault API Reference

## Core Functions

### `defineVault(config)`

Creates a vault instance with the specified configuration.

```typescript
const vault = defineVault({
  path: string;              // Path to vault storage directory
  plugins: PluginConfig[];   // Array of plugins (use 'as const')
  sqlite?: {
    enabled: boolean;        // Enable SQLite sync
    path: string;           // Path to SQLite database file
    syncInterval?: number;  // Auto-sync interval in ms
  };
});
```

### `definePlugin(config)`

Defines a plugin with tables and methods.

```typescript
const plugin = definePlugin({
  id: string;                // Unique plugin identifier
  name: string;              // Human-readable name
  tables: {                  // Table definitions
    [tableName: string]: {
      schema: SchemaDefinition;
      methods?: Record<string, ActionDefinition>;
    }
  };
  methods?: Record<string, ActionDefinition>;  // Plugin-level methods
});
```

### `defineQuery(definition)`

Defines a read-only query operation.

```typescript
import { type } from 'arktype';

const query = defineQuery({
  input: StandardSchemaV1;   // Input validation schema
  handler: async (input, context) => {
    // Query implementation
    return result;
  }
});
```

### `defineMutation(definition)`

Defines a write operation.

```typescript
import { type } from 'arktype';

const mutation = defineMutation({
  input: StandardSchemaV1;   // Input validation schema
  handler: async (input, context) => {
    // Mutation implementation
    return result;
  }
});
```

## Schema Definition

### Field Types

```typescript
type SchemaField = {
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'string[]' | 'number[]';
  required?: boolean;        // Field is required
  default?: any;             // Default value
  unique?: boolean;          // Field must be unique
  references?: string;       // References another table
};
```

### Example Schema

```typescript
const schema = {
  // Required fields
  title: { type: 'string', required: true },
  author: { type: 'string', required: true },
  
  // Optional with defaults
  score: { type: 'number', default: 0 },
  published: { type: 'boolean', default: false },
  
  // Date fields
  created_at: { type: 'date', required: true },
  updated_at: { type: 'date' },
  
  // Arrays
  tags: { type: 'string[]' },
  ratings: { type: 'number[]' },
  
  // JSON for arbitrary data
  metadata: { type: 'json' },
  
  // References
  author_id: { type: 'string', references: 'authors' },
  
  // Unique constraint
  slug: { type: 'string', unique: true }
};
```

## Vault Instance API

### Core Methods

```typescript
// Get vault statistics
await vault.stats(): Promise<{
  plugins: number;
  tables: number;
  totalRecords: number;
  tableStats: Record<string, number>;
}>;

// Export vault data
await vault.export(format: 'json' | 'sql' | 'markdown'): Promise<string>;

// Sync to SQLite
await vault.sync(): Promise<void>;

// Query SQLite directly (if enabled)
await vault.query(sql: string): Promise<any[]>;
```

### Plugin Methods

```typescript
// Access plugin-level methods
await vault.pluginName.methodName({ params });

// Example
await vault.reddit.getStats({});
await vault.reddit.exportAll({});
```

### Table Methods

#### Built-in CRUD Operations

```typescript
// Create a record
await vault.plugin.table.create(data: Omit<Schema, 'id'>): Promise<Schema>;

// Get by ID
await vault.plugin.table.get({ id: string }): Promise<Schema | null>;

// List all records
await vault.plugin.table.list(): Promise<Schema[]>;

// Update a record
await vault.plugin.table.update({ 
  id: string, 
  ...updates: Partial<Schema> 
}): Promise<Schema>;

// Delete a record
await vault.plugin.table.delete({ id: string }): Promise<boolean>;

// Check existence
await vault.plugin.table.exists({ id: string }): Promise<boolean>;

// Count records
await vault.plugin.table.count(): Promise<number>;
```

#### Custom Table Methods

```typescript
// Access custom methods defined in the table
await vault.plugin.table.customMethod({ params });

// Example
await vault.reddit.posts.getTopPosts({ limit: 10 });
await vault.reddit.posts.getBySubreddit({ subreddit: 'typescript' });
```

## Method Context API

### Table Method Context

Available in table method handlers:

```typescript
type TableContext = {
  list(): Promise<Schema[]>;
  get(id: string): Promise<Schema | null>;
  create(data: Omit<Schema, 'id'>): Promise<Schema>;
  update(id: string, updates: Partial<Schema>): Promise<Schema>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
};
```

Example usage:

```typescript
methods: {
  getPublished: defineQuery({
    input: type({}),
    handler: async (_, context) => {
      const all = await context.list();
      return all.filter(item => item.published);
    }
  })
}
```

### Plugin Method Context

Available in plugin method handlers:

```typescript
type PluginContext = {
  [tableName: string]: TableContext;
};
```

Example usage:

```typescript
methods: {
  crossTableQuery: defineQuery({
    input: type({}),
    handler: async (_, context) => {
      const posts = await context.posts.list();
      const comments = await context.comments.list();
      
      return posts.map(post => ({
        ...post,
        commentCount: comments.filter(c => c.post_id === post.id).length
      }));
    }
  })
}
```

## Arktype Validation

### Basic Types

```typescript
import { type } from 'arktype';

// Primitives
type({ name: 'string' })
type({ age: 'number' })
type({ active: 'boolean' })

// With defaults
type({ limit: 'number = 10' })
type({ published: 'boolean = false' })

// Arrays
type({ tags: 'string[]' })
type({ scores: 'number[]' })

// Objects
type({ metadata: 'object' })
```

### Constraints

```typescript
// Number constraints
type({ age: 'number > 0 < 150' })
type({ score: 'number >= 0 <= 100' })

// String patterns
type({ email: 'email' })
type({ url: 'url' })
type({ uuid: 'uuid' })
type({ username: 'string.alphanumeric' })

// String length
type({ password: 'string.length >= 8' })
type({ bio: 'string.length <= 500' })

// Union types
type({ status: '"draft" | "published" | "archived"' })
type({ role: '"admin" | "user" | "guest"' })
```

### Optional Fields

```typescript
// Optional with ?
type({
  'title': 'string',           // Required
  'description?': 'string',    // Optional
  'tags?': 'string[]'         // Optional array
})
```

### Complex Types

```typescript
// Nested objects
type({
  user: {
    name: 'string',
    email: 'email',
    age: 'number > 0'
  }
})

// Conditional types
type({
  type: '"post" | "comment"',
  'postId?': 'string',  // Only for comments
  'title?': 'string'     // Only for posts
})
```

## File Storage

### File Naming Convention

```
{pluginId}/{tableName}/{pluginId}_{tableName}_{timestamp}_{uniqueId}.md
```

Example:
```
reddit/posts/reddit_posts_1234567890_abc123.md
```

### File Format

```markdown
---
id: reddit_posts_1234567890_abc123
title: Hello World
author: John Doe
score: 42
tags: [intro, tutorial]
created_at: 2025-01-20T12:00:00Z
---

Optional markdown content.
Can include rich text, images, etc.
```

## SQLite Integration

When SQLite is enabled, tables are created with this naming:

```sql
-- Table name: {pluginId}_{tableName}
CREATE TABLE reddit_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_at DATETIME NOT NULL,
  -- ... other fields
);
```

Query examples:

```typescript
// Direct SQL queries
const results = await vault.query(`
  SELECT * FROM reddit_posts 
  WHERE score > 100 
  ORDER BY created_at DESC
`);

// Automatic sync
await vault.sync();  // Sync all changes to SQLite
```

## TypeScript Types

### Inferred Types

The vault provides full type inference:

```typescript
// TypeScript knows all these types automatically
const vault = defineVault({ plugins: [myPlugin] as const });

// vault.myPlugin exists
// vault.myPlugin.myTable exists
// vault.myPlugin.myTable.create expects correct schema
// vault.myPlugin.myMethod exists and expects correct input

const post = await vault.blog.posts.get({ id: '123' });
// TypeScript knows post is: Post | null

const posts = await vault.blog.posts.list();
// TypeScript knows posts is: Post[]
```

### Type Exports

```typescript
// Get inferred types from your vault
type MyVault = typeof vault;
type BlogPost = Awaited<ReturnType<typeof vault.blog.posts.get>>;
type Stats = Awaited<ReturnType<typeof vault.blog.getStats>>;
```