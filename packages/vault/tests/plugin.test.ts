import { describe, test, expect } from 'bun:test';
import { definePlugin } from '../src/plugin';

describe('Plugin Definition', () => {
  test('should create a valid plugin with tables and methods', () => {
    const plugin = definePlugin({
      id: 'test_plugin',
      name: 'Test Plugin',
      tables: {
        items: {
          schema: {
            name: { type: 'string', required: true },
            value: { type: 'number', default: 0 },
            active: { type: 'boolean', default: true }
          }
        }
      }
    });
    
    expect(plugin.id).toBe('test_plugin');
    expect(plugin.name).toBe('Test Plugin');
    expect(plugin.tables.items).toBeDefined();
    expect(plugin.tables.items.schema).toBeDefined();
    expect(plugin.tables.items.schema.name.type).toBe('string');
    expect(plugin.tables.items.schema.name.required).toBe(true);
  });

  test('should reject invalid plugin IDs', () => {
    // Invalid: uppercase and hyphen
    expect(() => definePlugin({
      id: 'Test-Plugin',
      name: 'Test',
      tables: {}
    })).toThrow('Invalid plugin ID');
    
    // Invalid: starts with number
    expect(() => definePlugin({
      id: '123plugin',
      name: 'Test',
      tables: {}
    })).toThrow('Invalid plugin ID');

    // Invalid: contains spaces
    expect(() => definePlugin({
      id: 'test plugin',
      name: 'Test',
      tables: {}
    })).toThrow('Invalid plugin ID');
  });

  test('should reject invalid table names', () => {
    expect(() => definePlugin({
      id: 'test',
      name: 'Test',
      tables: {
        'User-Data': {
          schema: {
            name: { type: 'string' }
          }
        }
      }
    })).toThrow('Invalid table name "User-Data"');

    expect(() => definePlugin({
      id: 'test',
      name: 'Test',
      tables: {
        '123table': {
          schema: {
            name: { type: 'string' }
          }
        }
      }
    })).toThrow('Invalid table name');
  });

  test('should accept valid plugin IDs and table names', () => {
    const validIds = ['blog', 'auth', 'user_management', 'api_v2'];
    
    validIds.forEach(id => {
      expect(() => definePlugin({
        id,
        name: 'Test',
        tables: {
          valid_table: { schema: { field: { type: 'string' } } },
          another_one: { schema: { field: { type: 'number' } } }
        }
      })).not.toThrow();
    });
  });

  test('should handle plugins without methods', () => {
    const plugin = definePlugin({
      id: 'simple',
      name: 'Simple Plugin',
      tables: {
        data: {
          schema: {
            value: { type: 'string' }
          }
        }
      }
    });

    expect(plugin.id).toBe('simple');
    expect(plugin.methods).toBeUndefined();
  });

  test('should handle complex table schemas', () => {
    const plugin = definePlugin({
      id: 'complex',
      name: 'Complex Plugin',
      tables: {
        posts: {
          schema: {
            title: { type: 'string', required: true },
            content: { type: 'string' },
            published: { type: 'boolean', default: false },
            views: { type: 'number', default: 0 },
            tags: { type: 'string[]' },
            metadata: { type: 'object' },
            created_at: { type: 'date', required: true },
            author_id: { type: 'string', references: 'authors' }
          }
        }
      }
    });

    const schema = plugin.tables.posts.schema;
    expect(schema.title.required).toBe(true);
    expect(schema.published.default).toBe(false);
    expect(schema.tags.type).toBe('string[]');
    expect(schema.author_id.references).toBe('authors');
  });
});