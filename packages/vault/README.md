# Vault System

A TypeScript-first data storage system that uses markdown files with YAML frontmatter as a database, featuring a plugin-based architecture with full type safety through StandardSchema validation.

## Features

- 🔌 **Plugin-based architecture** inspired by BetterAuth
- 🔒 **Full type safety** with StandardSchema v1 validation
- 📁 **Markdown storage** with YAML frontmatter
- 🎯 **Nested API structure** for clear namespace separation
- 🚀 **Arktype validation** for runtime type checking
- 💾 **SQLite integration** for advanced queries
- 🔍 **IntelliSense support** throughout the entire API

## Installation

```bash
bun install @repo/vault
```

## Quick Start

```typescript
import { defineVault, definePlugin, defineQuery, defineMutation } from '@repo/vault';
import { type } from 'arktype';

// Define a plugin with tables and methods
const blogPlugin = definePlugin({
  id: 'blog',
  name: 'Blog System',
  
  tables: {
    posts: {
      schema: {
        title: { type: 'string', required: true },
        content: { type: 'string', required: true },
        author: { type: 'string', required: true },
        published: { type: 'boolean', default: false },
        tags: { type: 'string[]' },
        created_at: { type: 'date', required: true }
      },
      
      methods: {
        getPublished: defineQuery({
          input: type({}),
          handler: async (_, context) => {
            const posts = await context.list();
            return posts.filter(p => p.published);
          }
        }),
        
        publish: defineMutation({
          input: type({ id: 'string' }),
          handler: async ({ id }, context) => {
            return context.update(id, { published: true });
          }
        })
      }
    }
  },
  
  methods: {
    getStats: defineQuery({
      input: type({}),
      handler: async (_, context) => {
        const posts = await context.posts.list();
        return {
          total: posts.length,
          published: posts.filter(p => p.published).length,
          draft: posts.filter(p => !p.published).length
        };
      }
    })
  }
});

// Create vault with plugins
const vault = defineVault({
  path: './my-vault',
  plugins: [blogPlugin] as const,
  sqlite: {
    enabled: true,
    path: './my-vault.db'
  }
});

// Use the vault with full type safety
const post = await vault.blog.posts.create({
  title: 'Hello World',
  content: 'My first post',
  author: 'John Doe',
  tags: ['intro', 'hello'],
  created_at: new Date()
});

const published = await vault.blog.posts.getPublished({});
const stats = await vault.blog.getStats({});
```

## API Structure

The vault uses a nested API pattern:

```typescript
// Table-level operations (CRUD + custom methods)
vault.pluginName.tableName.method({ params })

// Plugin-level operations
vault.pluginName.method({ params })

// Core vault operations
vault.method()
```

### Examples

```typescript
// Table operations
await vault.blog.posts.create({ title: 'New Post', ... })
await vault.blog.posts.get({ id: '123' })
await vault.blog.posts.list()
await vault.blog.posts.update({ id: '123', title: 'Updated' })
await vault.blog.posts.delete({ id: '123' })

// Custom table methods
await vault.blog.posts.getPublished({})
await vault.blog.posts.publish({ id: '123' })

// Plugin methods
await vault.blog.getStats({})
await vault.blog.exportAll({})

// Core vault methods
await vault.stats()
await vault.export('json')
await vault.sync()
```

## Defining Methods

All methods must use `defineQuery` or `defineMutation` with StandardSchema validation:

### Query (Read Operations)

```typescript
import { defineQuery } from '@repo/vault';
import { type } from 'arktype';

const getTopPosts = defineQuery({
  input: type({
    limit: 'number = 10',      // Default value
    minScore: 'number = 0'
  }),
  handler: async ({ limit, minScore }, context) => {
    const posts = await context.list();
    return posts
      .filter(p => p.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
});
```

### Mutation (Write Operations)

```typescript
import { defineMutation } from '@repo/vault';
import { type } from 'arktype';

const archiveOldPosts = defineMutation({
  input: type({
    olderThanDays: 'number'
  }),
  handler: async ({ olderThanDays }, context) => {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const posts = await context.list();
    
    for (const post of posts) {
      if (new Date(post.created_at).getTime() < cutoff) {
        await context.update(post.id, { archived: true });
      }
    }
    
    return { archived: posts.length };
  }
});
```

## File Structure

The vault creates this folder structure:

```
my-vault/
├── blog/                     # Plugin folder
│   ├── posts/               # Table folder
│   │   ├── blog_posts_1234567890_abc.md
│   │   └── blog_posts_1234567891_def.md
│   └── authors/
│       └── blog_authors_1234567892_ghi.md
└── analytics/               # Another plugin
    └── events/
        └── analytics_events_1234567893_jkl.md
```

Each markdown file contains YAML frontmatter with the record data:

```markdown
---
id: blog_posts_1234567890_abc
title: Hello World
author: John Doe
published: true
tags: [intro, hello]
created_at: 2025-01-20T12:00:00Z
---

Optional markdown content can go here.
This is useful for rich text content.
```

## Built-in Table Methods

Every table automatically gets these methods:

```typescript
// Create a new record
await vault.plugin.table.create(data)

// Get a record by ID
await vault.plugin.table.get({ id: '123' })

// List all records
await vault.plugin.table.list()

// Update a record
await vault.plugin.table.update({ id: '123', ...updates })

// Delete a record
await vault.plugin.table.delete({ id: '123' })

// Check if a record exists
await vault.plugin.table.exists({ id: '123' })

// Count records
await vault.plugin.table.count()
```

## Method Context

### Table Method Context

Table methods receive a context with operations for that specific table:

```typescript
defineQuery({
  input: type({ author: 'string' }),
  handler: async ({ author }, context) => {
    // Available context methods:
    await context.list()           // Get all records
    await context.get(id)          // Get by ID
    await context.create(data)     // Create record
    await context.update(id, data) // Update record
    await context.delete(id)       // Delete record
    await context.count()          // Count records
    await context.exists(id)       // Check existence
  }
})
```

### Plugin Method Context

Plugin methods receive a context with access to all plugin tables:

```typescript
defineQuery({
  input: type({}),
  handler: async (_, context) => {
    // Access all plugin tables:
    const posts = await context.posts.list()
    const authors = await context.authors.list()
    
    // Can use any table operation
    await context.posts.create({ ... })
    await context.authors.get('123')
  }
})
```

## Type Safety with Arktype

The vault uses [Arktype](https://arktype.io) for runtime validation with excellent TypeScript inference:

```typescript
import { type } from 'arktype';

// Simple types with defaults
input: type({
  name: 'string',
  age: 'number = 18',
  active: 'boolean = true'
})

// Advanced validations
input: type({
  email: 'email',
  age: 'number > 0 < 150',
  username: 'string.alphanumeric',
  tags: 'string[]',
  metadata: 'object'
})

// Union types
input: type({
  status: '"draft" | "published" | "archived"'
})

// Optional fields
input: type({
  'title': 'string',
  'description?': 'string'  // Optional with ?
})
```

## Real-World Example

See the Reddit plugin for a complete example:

```typescript
import { definePlugin, defineQuery } from '@repo/vault';
import { type } from 'arktype';

export const redditPlugin = definePlugin({
  id: 'reddit',
  name: 'Reddit Integration',
  
  tables: {
    posts: {
      schema: {
        title: { type: 'string', required: true },
        author: { type: 'string', required: true },
        subreddit: { type: 'string', required: true },
        score: { type: 'number', default: 0 },
        created_at: { type: 'date', required: true }
      },
      
      methods: {
        getTopPosts: defineQuery({
          input: type({ limit: 'number = 10' }),
          handler: async ({ limit }, context) => {
            const posts = await context.list();
            return posts
              .sort((a, b) => b.score - a.score)
              .slice(0, limit);
          }
        }),
        
        getBySubreddit: defineQuery({
          input: type({ subreddit: 'string' }),
          handler: async ({ subreddit }, context) => {
            const posts = await context.list();
            return posts.filter(p => p.subreddit === subreddit);
          }
        })
      }
    },
    
    comments: {
      schema: {
        body: { type: 'string', required: true },
        author: { type: 'string', required: true },
        post_id: { type: 'string', required: true }
      }
    }
  },
  
  methods: {
    getStats: defineQuery({
      input: type({}),
      handler: async (_, context) => {
        const posts = await context.posts.list();
        const comments = await context.comments.list();
        
        return {
          totalPosts: posts.length,
          totalComments: comments.length,
          topPost: posts.sort((a, b) => b.score - a.score)[0]
        };
      }
    })
  }
});
```

## Running the Demo

```bash
# Install dependencies
bun install

# Run the demo
bun run demo

# Run in development mode
bun run dev
```

## Architecture

For a detailed explanation of the vault architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## License

MIT