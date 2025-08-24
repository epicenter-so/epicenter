# Vault Architecture

## Overview

The Vault system is a TypeScript-first data storage solution that uses markdown files with YAML frontmatter as its database. It features a plugin-based architecture inspired by BetterAuth, with full type safety through StandardSchema validation and a nested API structure.

## Core Concepts

### 1. Plugin-Based Architecture

Plugins extend the vault with tables and methods:

```typescript
import { definePlugin } from './plugin';
import { defineQuery, defineMutation } from './actions';
import { type } from 'arktype';

const myPlugin = definePlugin({
  id: 'my_plugin',
  name: 'My Plugin',
  
  tables: {
    items: {
      schema: {
        title: { type: 'string', required: true },
        completed: { type: 'boolean', default: false }
      },
      methods: {
        getCompleted: defineQuery({
          input: type({}),
          handler: async (_, context) => {
            const items = await context.list();
            return items.filter(i => i.completed);
          }
        })
      }
    }
  },
  
  methods: {
    exportAll: defineQuery({
      input: type({}),
      handler: async (_, context) => {
        return {
          items: await context.items.list()
        };
      }
    })
  }
});
```

### 2. Nested API Structure

The vault uses a nested API pattern for clear namespace separation:

```typescript
// Table-level operations
vault.pluginName.tableName.method({ params })

// Examples:
vault.reddit.posts.create({ title: 'Hello' })
vault.reddit.posts.get({ id: '123' })
vault.reddit.posts.getTopPosts({ limit: 10 })

// Plugin-level operations
vault.reddit.getStats({})
vault.reddit.exportAll({})

// Core vault operations
vault.stats()
vault.export('json')
vault.sync()
```

### 3. StandardSchema Validation

All methods must use `defineQuery` or `defineMutation` with StandardSchema v1 compatible validation:

```typescript
import { type } from 'arktype';

// Query - for read operations
getTopPosts: defineQuery({
  input: type({
    limit: 'number = 10',
    minScore: 'number = 0'
  }),
  handler: async ({ limit, minScore }, context) => {
    const posts = await context.list();
    return posts
      .filter(p => p.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
})

// Mutation - for write operations
archivePosts: defineMutation({
  input: type({
    olderThanDays: 'number'
  }),
  handler: async ({ olderThanDays }, context) => {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const posts = await context.list();
    const toArchive = posts.filter(p => 
      new Date(p.created_at).getTime() < cutoff
    );
    // Archive logic here
    return { archived: toArchive.length };
  }
})
```

## Architecture Components

### 1. Actions System (`src/actions.ts`)

Provides `defineQuery` and `defineMutation` functions that:
- Enforce StandardSchema validation on inputs
- Support multiple validation libraries (Zod, Arktype, Valibot)
- Provide type-safe handlers with validated inputs
- Enable clear separation between read and write operations

```typescript
export type QueryDefinition<TSchema, TOutput, TContext> = {
  type: 'query';
  input: TSchema;
  handler: QueryHandler<StandardSchemaV1.InferInput<TSchema>, TOutput, TContext>;
};

export type MutationDefinition<TSchema, TOutput, TContext> = {
  type: 'mutation';
  input: TSchema;
  handler: MutationHandler<StandardSchemaV1.InferInput<TSchema>, TOutput, TContext>;
};
```

### 2. Plugin System (`src/plugin.ts`)

Defines the plugin structure with:
- **Tables**: Data schemas with optional methods
- **Methods**: Plugin-level operations that span tables
- **Validation**: ID and name format enforcement

```typescript
export type PluginConfig = {
  id: string;           // Unique identifier (lowercase, alphanumeric + underscore)
  name: string;         // Human-readable name
  tables: Record<string, TableConfig>;
  methods?: Record<string, ActionDefinition>;
};

export type TableConfig = {
  schema: SchemaDefinition;
  methods?: Record<string, ActionDefinition>;
};
```

### 3. Vault Core (`src/vault.ts`)

The main vault implementation that:
- Creates nested API structure from plugins
- Provides CRUD operations for each table
- Manages file system storage
- Handles SQLite synchronization
- Executes plugin and table methods

Key responsibilities:
1. **Plugin Integration**: Processes plugins to create the nested structure
2. **Storage Management**: Handles markdown file operations
3. **Method Execution**: Runs queries and mutations with proper context
4. **Type Safety**: Maintains full TypeScript inference

## File System Structure

```
vault-path/
├── plugin_id/
│   ├── table_name/
│   │   ├── plugin_id_table_name_[timestamp]_[id].md
│   │   └── ...
│   └── another_table/
│       └── ...
└── another_plugin/
    └── ...
```

Example:
```
demo-vault/
├── reddit/
│   ├── posts/
│   │   ├── reddit_posts_1234567890_abc123.md
│   │   └── reddit_posts_1234567891_def456.md
│   ├── comments/
│   │   └── reddit_comments_1234567892_ghi789.md
│   └── subreddits/
│       └── reddit_subreddits_1234567893_jkl012.md
└── twitter/
    ├── tweets/
    │   └── twitter_tweets_1234567894_mno345.md
    └── users/
        └── twitter_users_1234567895_pqr678.md
```

## SQLite Integration

When SQLite is enabled, tables are created with flat naming:
- `reddit_posts` (not `reddit.posts`)
- `reddit_comments` (not `reddit.comments`)
- `twitter_tweets` (not `twitter.tweets`)

This provides compatibility with SQL queries while maintaining the nested API structure in TypeScript.

## Type System Flow

1. **Plugin Definition**: Plugins define schemas and methods with types
2. **Validation**: Arktype or other StandardSchema validators ensure type safety
3. **Context Building**: Each method receives a typed context with table accessors
4. **API Surface**: The final vault object has full IntelliSense for all operations

```typescript
// Full type inference example
const vault = defineVault({
  plugins: [redditPlugin]
});

// TypeScript knows:
// - vault.reddit exists
// - vault.reddit.posts exists
// - vault.reddit.posts.getTopPosts expects { limit?: number }
// - vault.reddit.posts.getTopPosts returns Post[]
const topPosts = await vault.reddit.posts.getTopPosts({ limit: 5 });
```

## Method Context

Each method handler receives a context object that provides access to:

### Table Methods Context
```typescript
methods: {
  getTopPosts: defineQuery({
    input: type({ limit: 'number' }),
    handler: async ({ limit }, context) => {
      // context provides access to this table's operations:
      await context.list()        // List all records
      await context.get(id)       // Get by ID
      await context.create(data)  // Create new record
      await context.update(id, data) // Update record
      await context.delete(id)    // Delete record
      await context.count()       // Count records
      await context.exists(id)    // Check existence
    }
  })
}
```

### Plugin Methods Context
```typescript
methods: {
  exportAll: defineQuery({
    input: type({}),
    handler: async (_, context) => {
      // context provides access to all plugin tables:
      await context.posts.list()
      await context.comments.list()
      await context.subreddits.list()
    }
  })
}
```

## Best Practices

### 1. Use Arktype for Input Validation
```typescript
import { type } from 'arktype';

// Good - using arktype with defaults
input: type({
  limit: 'number = 10',
  offset: 'number = 0'
})

// Also supports complex validations
input: type({
  email: 'email',
  age: 'number > 0 < 150',
  tags: 'string[]'
})
```

### 2. Separate Queries from Mutations
- Use `defineQuery` for read operations
- Use `defineMutation` for write operations
- This helps with caching, optimistic updates, and understanding data flow

### 3. Keep Methods Focused
Each method should have a single, clear purpose:
```typescript
// Good - focused methods
getByAuthor: defineQuery({ ... })
getPublished: defineQuery({ ... })
getByDateRange: defineQuery({ ... })

// Avoid - overly generic methods
getFiltered: defineQuery({ ... }) // Too broad
```

### 4. Use Plugin-Level Methods for Cross-Table Operations
```typescript
// Plugin method that accesses multiple tables
getPostsWithComments: defineQuery({
  input: type({}),
  handler: async (_, context) => {
    const posts = await context.posts.list();
    const comments = await context.comments.list();
    
    return posts.map(post => ({
      ...post,
      comments: comments.filter(c => c.post_id === post.id)
    }));
  }
})
```

## Future Enhancements

Planned improvements include:
- Relationship definitions and automatic joins
- Migration system for schema changes
- Real-time file watching and hot reload
- Advanced caching strategies
- Query optimization for large datasets
- GraphQL API generation
- REST API generation