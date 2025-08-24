import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { defineVault, definePlugin } from '../src';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const testPlugin = definePlugin({
  id: 'test',
  name: 'Test Plugin',
  tables: {
    items: {
      schema: {
        title: { type: 'string', required: true },
        description: { type: 'string' },
        priority: { type: 'number', default: 0 },
        completed: { type: 'boolean', default: false },
        tags: { type: 'string[]' },
        created_at: { type: 'date', required: true }
      }
    }
  }
});

describe('CRUD Operations', () => {
  let vault: any;
  const TEST_VAULT_PATH = './test-vault-crud';

  beforeEach(async () => {
    // Clean up any existing test vault
    if (existsSync(TEST_VAULT_PATH)) {
      await rm(TEST_VAULT_PATH, { recursive: true });
    }

    // Create fresh vault
    vault = defineVault({
      path: TEST_VAULT_PATH,
      plugins: [testPlugin] as const
    });
  });

  afterEach(async () => {
    // Clean up
    if (existsSync(TEST_VAULT_PATH)) {
      await rm(TEST_VAULT_PATH, { recursive: true });
    }
  });

  describe('Create Operation', () => {
    test('should create a new record with auto-generated ID', async () => {
      const record = await vault.test.items.create({
        title: 'Test Item',
        description: 'This is a test item',
        priority: 5,
        completed: false,
        tags: ['test', 'sample'],
        created_at: new Date()
      });

      expect(record.id).toBeDefined();
      expect(record.id).toMatch(/^test_items_\d+_[a-z0-9]+$/);
      expect(record.title).toBe('Test Item');
      expect(record.priority).toBe(5);
      expect(record.tags).toEqual(['test', 'sample']);
    });

    test('should apply default values', async () => {
      const record = await vault.test.items.create({
        title: 'Minimal Item',
        created_at: new Date()
      });

      expect(record.priority).toBe(0); // default value
      expect(record.completed).toBe(false); // default value
      expect(record.description).toBeUndefined();
    });

    test('should create markdown file in correct location', async () => {
      const record = await vault.test.items.create({
        title: 'File Test',
        created_at: new Date()
      });

      const filePath = join(TEST_VAULT_PATH, 'test', 'items', `${record.id}.md`);
      expect(existsSync(filePath)).toBe(true);
    });

    test('should handle content field separately', async () => {
      const record = await vault.test.items.create({
        title: 'Content Test',
        created_at: new Date(),
        content: '# Markdown Content\n\nThis is the body.'
      });

      expect(record.content).toBe('# Markdown Content\n\nThis is the body.');
    });
  });

  describe('Get Operation', () => {
    test('should retrieve a record by ID', async () => {
      const created = await vault.test.items.create({
        title: 'Get Test',
        priority: 10,
        created_at: new Date()
      });

      const retrieved = await vault.test.items.get({ id: created.id });

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe('Get Test');
      expect(retrieved?.priority).toBe(10);
    });

    test('should return null for non-existent ID', async () => {
      const result = await vault.test.items.get({ id: 'non_existent_id' });
      expect(result).toBeNull();
    });

    test('should preserve all field types', async () => {
      const now = new Date();
      const created = await vault.test.items.create({
        title: 'Type Test',
        description: 'Testing types',
        priority: 42,
        completed: true,
        tags: ['type', 'test'],
        created_at: now
      });

      const retrieved = await vault.test.items.get({ id: created.id });

      expect(retrieved?.title).toBe('Type Test');
      expect(retrieved?.description).toBe('Testing types');
      expect(retrieved?.priority).toBe(42);
      expect(retrieved?.completed).toBe(true);
      expect(retrieved?.tags).toEqual(['type', 'test']);
      // Date comparison might need to account for serialization
      expect(new Date(retrieved?.created_at).getTime()).toBeCloseTo(now.getTime(), -2);
    });
  });

  describe('List Operation', () => {
    test('should list all records', async () => {
      // Create multiple records
      await vault.test.items.create({ title: 'Item 1', created_at: new Date() });
      await vault.test.items.create({ title: 'Item 2', created_at: new Date() });
      await vault.test.items.create({ title: 'Item 3', created_at: new Date() });

      const items = await vault.test.items.list();

      expect(items).toHaveLength(3);
      expect(items.map(i => i.title).sort()).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    test('should return empty array when no records exist', async () => {
      const items = await vault.test.items.list();
      expect(items).toEqual([]);
    });

    test('should include all fields in listed records', async () => {
      await vault.test.items.create({
        title: 'Complete Item',
        description: 'Full details',
        priority: 8,
        completed: true,
        tags: ['complete'],
        created_at: new Date()
      });

      const items = await vault.test.items.list();

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Complete Item');
      expect(items[0].description).toBe('Full details');
      expect(items[0].priority).toBe(8);
      expect(items[0].completed).toBe(true);
      expect(items[0].tags).toEqual(['complete']);
    });
  });

  describe('Update Operation', () => {
    test('should update an existing record', async () => {
      const record = await vault.test.items.create({
        title: 'Original Title',
        priority: 1,
        completed: false,
        created_at: new Date()
      });

      const updated = await vault.test.items.update({
        id: record.id,
        title: 'Updated Title',
        priority: 10,
        completed: true
      });

      expect(updated.id).toBe(record.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.priority).toBe(10);
      expect(updated.completed).toBe(true);
    });

    test('should persist updates to disk', async () => {
      const record = await vault.test.items.create({
        title: 'Persist Test',
        created_at: new Date()
      });

      await vault.test.items.update({
        id: record.id,
        title: 'Persisted Update'
      });

      const retrieved = await vault.test.items.get({ id: record.id });
      expect(retrieved?.title).toBe('Persisted Update');
    });

    test('should throw error when updating non-existent record', async () => {
      await expect(vault.test.items.update({
        id: 'non_existent',
        title: 'Will Fail'
      })).rejects.toThrow('Record non_existent not found');
    });

    test('should allow partial updates', async () => {
      const record = await vault.test.items.create({
        title: 'Partial Test',
        description: 'Original description',
        priority: 5,
        created_at: new Date()
      });

      const updated = await vault.test.items.update({
        id: record.id,
        priority: 10
        // Not updating title or description
      });

      expect(updated.title).toBe('Partial Test');
      expect(updated.description).toBe('Original description');
      expect(updated.priority).toBe(10);
    });
  });

  describe('Delete Operation', () => {
    test('should delete an existing record', async () => {
      const record = await vault.test.items.create({
        title: 'To Delete',
        created_at: new Date()
      });

      const deleted = await vault.test.items.delete({ id: record.id });
      expect(deleted).toBe(true);

      const retrieved = await vault.test.items.get({ id: record.id });
      expect(retrieved).toBeNull();
    });

    test('should remove file from disk', async () => {
      const record = await vault.test.items.create({
        title: 'File Delete Test',
        created_at: new Date()
      });

      const filePath = join(TEST_VAULT_PATH, 'test', 'items', `${record.id}.md`);
      expect(existsSync(filePath)).toBe(true);

      await vault.test.items.delete({ id: record.id });
      expect(existsSync(filePath)).toBe(false);
    });

    test('should return false when deleting non-existent record', async () => {
      const result = await vault.test.items.delete({ id: 'non_existent' });
      expect(result).toBe(false);
    });
  });

  describe('Count Operation', () => {
    test('should count all records', async () => {
      expect(await vault.test.items.count()).toBe(0);

      await vault.test.items.create({ title: 'Item 1', created_at: new Date() });
      expect(await vault.test.items.count()).toBe(1);

      await vault.test.items.create({ title: 'Item 2', created_at: new Date() });
      await vault.test.items.create({ title: 'Item 3', created_at: new Date() });
      expect(await vault.test.items.count()).toBe(3);

      await vault.test.items.delete({ id: (await vault.test.items.list())[0].id });
      expect(await vault.test.items.count()).toBe(2);
    });
  });

  describe('Exists Operation', () => {
    test('should check if record exists', async () => {
      const record = await vault.test.items.create({
        title: 'Exists Test',
        created_at: new Date()
      });

      expect(await vault.test.items.exists({ id: record.id })).toBe(true);
      expect(await vault.test.items.exists({ id: 'non_existent' })).toBe(false);

      await vault.test.items.delete({ id: record.id });
      expect(await vault.test.items.exists({ id: record.id })).toBe(false);
    });
  });
});