import { readdir, readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import matter from 'gray-matter';
import type { PluginConfig, TableConfig } from './plugin';
import type {
	BuildVaultType,
	VaultConfig,
	BaseTableMethods,
	InferRecord,
	SchemaDefinition,
	VaultCoreMethods,
} from './types';
import {
	getPluginPath,
	getTablePath,
	getSQLiteTableName,
	generateRecordId,
	getRecordPath,
	parseRecordFilename,
	isMarkdownFile,
} from './utils';

/**
 * Topological sort for dependency resolution
 * Ensures plugins are built in correct order with dependencies first
 */
function topologicalSort(plugins: readonly PluginConfig[]): PluginConfig[] {
	const sorted: PluginConfig[] = [];
	const visited = new Set<string>();
	const visiting = new Set<string>();
	const pluginMap = new Map<string, PluginConfig>();

	// Create a map for quick lookup
	for (const plugin of plugins) {
		pluginMap.set(plugin.id, plugin);
	}

	function visit(plugin: PluginConfig) {
		if (visited.has(plugin.id)) return;
		
		if (visiting.has(plugin.id)) {
			throw new Error(`Circular dependency detected involving plugin: ${plugin.id}`);
		}

		visiting.add(plugin.id);

		// Visit dependencies first
		if (plugin.dependencies) {
			for (const dep of plugin.dependencies) {
				// Check if dependency is in the plugin list
				if (!pluginMap.has(dep.id)) {
					// Add dependency to the map if not present
					pluginMap.set(dep.id, dep);
				}
				visit(dep);
			}
		}

		visiting.delete(plugin.id);
		visited.add(plugin.id);
		sorted.push(plugin);
	}

	// Visit all plugins
	for (const plugin of plugins) {
		visit(plugin);
	}

	return sorted;
}

/**
 * Define a vault with plugins using the transform pattern
 * Plugins can transform the vault to add their functionality
 */
export function defineVault<const TPlugins extends readonly PluginConfig[]>(
	config: VaultConfig<TPlugins>,
): BuildVaultType<TPlugins> {
	// Ensure vault directory exists
	if (!existsSync(config.path)) {
		mkdirSync(config.path, { recursive: true });
	}

	// Sort plugins by dependencies
	const sorted = topologicalSort(config.plugins);

	// Initialize vault with core methods
	let vault: Record<string, unknown> = createCoreVaultMethods(config);

	// Build each plugin in dependency order
	for (const plugin of sorted) {
		// Ensure plugin directory exists
		const pluginPath = getPluginPath(config.path, plugin.id);
		if (!existsSync(pluginPath)) {
			mkdirSync(pluginPath, { recursive: true });
		}

		// Add base CRUD for this plugin's tables
		vault = addBaseCrud(vault, plugin, config.path);

		// Apply transform (always present due to definePlugin)
		vault = plugin.transform(vault);
	}

	return vault as BuildVaultType<TPlugins>;
}

/**
 * Add base CRUD methods for a plugin's tables
 */
function addBaseCrud(vault: Record<string, unknown>, plugin: PluginConfig, vaultPath: string): Record<string, unknown> {
	const pluginBase: Record<string, unknown> = {};

	// Add CRUD for each table
	for (const [tableName, tableConfig] of Object.entries(plugin.tables)) {
		const tablePath = getTablePath(vaultPath, plugin.id, tableName);
		
		// Ensure table directory exists
		if (!existsSync(tablePath)) {
			mkdirSync(tablePath, { recursive: true });
		}

		pluginBase[tableName] = createTableMethods(
			vaultPath,
			plugin.id,
			tableName,
			tableConfig.schema
		);
	}

	return {
		...vault,
		[plugin.id]: {
			...vault[plugin.id],
			...pluginBase,
		},
	};
}


/**
 * Create standard CRUD methods for a table
 */
function createTableMethods<TSchema extends SchemaDefinition>(
	vaultPath: string,
	pluginId: string,
	tableName: string,
	schema: TSchema,
): BaseTableMethods<TSchema> {
	const tablePath = getTablePath(vaultPath, pluginId, tableName);
	const sqliteTableName = getSQLiteTableName(pluginId, tableName);

	return {
		async get({ id }: { id: string }): Promise<InferRecord<TSchema> | null> {
			const filePath = getRecordPath(vaultPath, pluginId, tableName, id);
			if (!existsSync(filePath)) return null;

			const content = await readFile(filePath, 'utf-8');
			const { data, content: body } = matter(content);

			return {
				...data,
				id,
				content: body,
			} as InferRecord<TSchema>;
		},

		async list(): Promise<InferRecord<TSchema>[]> {
			if (!existsSync(tablePath)) return [];

			const files = await readdir(tablePath);
			const mdFiles = files.filter(isMarkdownFile);

			const records = await Promise.all(
				mdFiles.map(async (file) => {
					const id = parseRecordFilename(file);
					return this.get({ id });
				}),
			);

			return records.filter(Boolean) as InferRecord<TSchema>[];
		},

		async create(record: Omit<InferRecord<TSchema>, 'id'>): Promise<InferRecord<TSchema>> {
			const id = generateRecordId(sqliteTableName);
			const { content = '', ...providedData } = record as Record<string, unknown> & { content?: string };

			// Apply default values from schema
			const dataWithDefaults: Record<string, unknown> = {};
			for (const [fieldName, fieldDef] of Object.entries(schema)) {
				if (providedData[fieldName] !== undefined) {
					dataWithDefaults[fieldName] = providedData[fieldName];
				} else if (fieldDef.default !== undefined) {
					dataWithDefaults[fieldName] = fieldDef.default;
				}
			}

			const fileContent = matter.stringify(content, { ...dataWithDefaults, id });
			const filePath = getRecordPath(vaultPath, pluginId, tableName, id);

			await writeFile(filePath, fileContent);

			return {
				...dataWithDefaults,
				id,
				content,
			} as InferRecord<TSchema>;
		},

		async update({ id, ...updates }: { id: string } & Partial<InferRecord<TSchema>>): Promise<InferRecord<TSchema>> {
			const existing = await this.get({ id });
			if (!existing) {
				throw new Error(`Record ${id} not found in ${sqliteTableName}`);
			}

			const { content = existing.content, ...updateFrontMatter } = updates as Record<string, unknown> & { content?: string };
			const { content: _, ...existingFrontMatter } = existing as Record<string, unknown> & { content: string };
			const mergedFrontMatter = { ...existingFrontMatter, ...updateFrontMatter };
			const updated = { ...mergedFrontMatter, id, content };

			const fileContent = matter.stringify(content, mergedFrontMatter);
			const filePath = getRecordPath(vaultPath, pluginId, tableName, id);

			await writeFile(filePath, fileContent);

			return updated as InferRecord<TSchema>;
		},

		async delete({ id }: { id: string }): Promise<boolean> {
			const filePath = getRecordPath(vaultPath, pluginId, tableName, id);
			if (!existsSync(filePath)) return false;

			await unlink(filePath);
			return true;
		},

		async count(): Promise<number> {
			const results = await this.list();
			return results.length;
		},

		async exists({ id }: { id: string }): Promise<boolean> {
			const filePath = getRecordPath(vaultPath, pluginId, tableName, id);
			return existsSync(filePath);
		},
	};
}

/**
 * Create core vault methods
 */
function createCoreVaultMethods<TPlugins extends readonly PluginConfig[]>(
	config: VaultConfig<TPlugins>,
): VaultCoreMethods {
	return {
		async sync() {
			console.log('Syncing vault to SQLite...');
			
			for (const plugin of config.plugins) {
				for (const tableName of Object.keys(plugin.tables)) {
					const sqliteTableName = getSQLiteTableName(plugin.id, tableName);
					console.log(`  Syncing table: ${sqliteTableName}`);
					
					// TODO: Actual SQLite sync
				}
			}
		},

		async refresh() {
			console.log('Refreshing vault from disk...');
			for (const plugin of config.plugins) {
				const pluginPath = getPluginPath(config.path, plugin.id);
				console.log(`  Refreshing plugin: ${plugin.id} from ${pluginPath}`);
			}
		},

		async export(format: 'json' | 'sql' | 'markdown') {
			console.log(`Exporting vault as ${format}...`);

			if (format === 'json') {
				const result: Record<string, unknown> = {};
				
				// Export all plugin data
				// Note: In the actual implementation, we'd need to traverse the vault structure
				// This is simplified for now
				return JSON.stringify(result, null, 2);
			}

			if (format === 'sql') {
				const statements: string[] = [];
				
				for (const plugin of config.plugins) {
					for (const tableName of Object.keys(plugin.tables)) {
						const sqliteTableName = getSQLiteTableName(plugin.id, tableName);
						
						statements.push(`-- Plugin: ${plugin.id}, Table: ${tableName}`);
						statements.push(`CREATE TABLE IF NOT EXISTS ${sqliteTableName} (`);
						statements.push(`  id TEXT PRIMARY KEY,`);
						statements.push(`  content TEXT,`);
						statements.push(`  created_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
						statements.push(`);`);
						statements.push('');
					}
				}

				return statements.join('\n');
			}

			if (format === 'markdown') {
				let output = '# Vault Export\n\n';
				
				for (const plugin of config.plugins) {
					output += `## Plugin: ${plugin.name} (${plugin.id})\n\n`;
					
					for (const tableName of Object.keys(plugin.tables)) {
						const tablePath = getTablePath(config.path, plugin.id, tableName);
						output += `### Table: ${tableName}\n`;
						output += `Path: \`${tablePath}\`\n\n`;
					}
				}

				return output;
			}

			return '-- Export format not implemented';
		},

		async stats() {
			const tableStats: Record<string, number> = {};
			let totalRecords = 0;

			// Note: In actual implementation, we'd need to traverse vault to get counts
			// This is simplified for now
			
			return {
				plugins: config.plugins.length,
				tables: Object.keys(tableStats).length,
				totalRecords,
				tableStats,
				lastSync: null,
			};
		},

		async query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
			console.log('Executing SQL query:', sql);
			// TODO: Implement SQLite query execution
			return [];
		},
	};
}