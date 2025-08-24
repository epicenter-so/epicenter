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
import { validateWithSchema } from './actions';
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
 * Define a vault with plugins using clean architecture
 * 
 * No redundant data structures - everything is derived from config
 */
export function defineVault<const TPlugins extends readonly PluginConfig[]>(
	config: VaultConfig<TPlugins>,
): BuildVaultType<TPlugins> {
	// Ensure vault directory exists synchronously
	if (!existsSync(config.path)) {
		mkdirSync(config.path, { recursive: true });
	}

	// Build vault with nested structure
	const vault: any = {};

	// Process each plugin
	for (const plugin of config.plugins) {
		const pluginPath = getPluginPath(config.path, plugin.id);
		
		// Ensure plugin directory exists synchronously
		if (!existsSync(pluginPath)) {
			mkdirSync(pluginPath, { recursive: true });
		}

		// Create plugin object
		const pluginObj: any = {};

		// Create table methods for each table in the plugin
		for (const [tableName, tableConfig] of Object.entries(plugin.tables)) {
			const tablePath = getTablePath(config.path, plugin.id, tableName);
			const sqliteTableName = getSQLiteTableName(plugin.id, tableName);
			
			// Ensure table directory exists synchronously
			if (!existsSync(tablePath)) {
				mkdirSync(tablePath, { recursive: true });
			}

			// Create base CRUD methods for this table
			const baseMethods = createTableMethods(
				config.path,
				plugin.id,
				tableName,
				tableConfig.schema
			);
			
			// Add table-level methods if defined
			if (tableConfig.methods) {
				const tableMethods = createMethodsForTable(
					tableConfig.methods,
					baseMethods
				);
				pluginObj[tableName] = { ...baseMethods, ...tableMethods };
			} else {
				pluginObj[tableName] = baseMethods;
			}
		}

		// Add plugin-level methods if defined
		if (plugin.methods) {
			const pluginMethods = createMethodsForPlugin(
				plugin.methods,
				pluginObj
			);
			Object.assign(pluginObj, pluginMethods);
		}

		// Add plugin to vault
		vault[plugin.id] = pluginObj;
	}

	// Add core vault methods
	Object.assign(vault, createCoreVaultMethods(config, vault));

	return vault as BuildVaultType<TPlugins>;
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
	// Derive paths once
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
			const { content = '', ...providedData } = record as any;

			// Apply default values from schema
			const dataWithDefaults: any = {};
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

			const { content = existing.content, ...frontMatter } = updates as any;
			const updated = { ...existing, ...frontMatter, content };

			const fileContent = matter.stringify(content, { ...frontMatter, id });
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
 * Create core vault methods - simplified without redundant Map
 */
function createCoreVaultMethods(
	config: VaultConfig<any>,
	vault: any,
): VaultCoreMethods {
	return {
		async sync() {
			console.log('Syncing vault to SQLite...');
			
			// Iterate config directly - no Map needed!
			for (const plugin of config.plugins) {
				for (const tableName of Object.keys(plugin.tables)) {
					const sqliteTableName = getSQLiteTableName(plugin.id, tableName);
					console.log(`  Syncing table: ${sqliteTableName}`);
					
					// TODO: Actual SQLite sync
					// 1. Create table ${sqliteTableName}
					// 2. Read from ${getTablePath(config.path, plugin.id, tableName)}
					// 3. Insert into SQLite
				}
			}
		},

		async refresh() {
			console.log('Refreshing vault from disk...');
			// Just iterate the config - we can derive all paths
			for (const plugin of config.plugins) {
				const pluginPath = getPluginPath(config.path, plugin.id);
				console.log(`  Refreshing plugin: ${plugin.id} from ${pluginPath}`);
			}
		},

		async export(format: 'json' | 'sql' | 'markdown') {
			console.log(`Exporting vault as ${format}...`);

			if (format === 'json') {
				const result: Record<string, any> = {};
				
				// Just iterate config - no Map needed
				for (const plugin of config.plugins) {
					result[plugin.id] = {};
					
					for (const tableName of Object.keys(plugin.tables)) {
						const table = vault[plugin.id][tableName];
						if (table && typeof table.list === 'function') {
							result[plugin.id][tableName] = await table.list();
						}
					}
				}

				return JSON.stringify(result, null, 2);
			}

			if (format === 'sql') {
				const statements: string[] = [];
				
				// Generate CREATE TABLE statements from config
				for (const plugin of config.plugins) {
					for (const tableName of Object.keys(plugin.tables)) {
						const sqliteTableName = getSQLiteTableName(plugin.id, tableName);
						
						statements.push(`-- Plugin: ${plugin.id}, Table: ${tableName}`);
						statements.push(`CREATE TABLE IF NOT EXISTS ${sqliteTableName} (`);
						statements.push(`  id TEXT PRIMARY KEY,`);
						statements.push(`  content TEXT,`);
						statements.push(`  created_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
						// TODO: Add columns based on schema
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
						const table = vault[plugin.id][tableName];
						if (table && typeof table.list === 'function') {
							const records = await table.list();
							output += `### Table: ${tableName} (${records.length} records)\n\n`;
							
							// Show table path for clarity
							const tablePath = getTablePath(config.path, plugin.id, tableName);
							output += `Path: \`${tablePath}\`\n\n`;
						}
					}
				}

				return output;
			}

			return '-- Export format not implemented';
		},

		async stats() {
			const tableStats: Record<string, number> = {};
			let totalRecords = 0;

			// Simple iteration of config - derive everything else
			for (const plugin of config.plugins) {
				for (const tableName of Object.keys(plugin.tables)) {
					const table = vault[plugin.id][tableName];
					if (table && typeof table.count === 'function') {
						const count = await table.count();
						const key = `${plugin.id}.${tableName}`;
						tableStats[key] = count;
						totalRecords += count;
					}
				}
			}

			return {
				plugins: config.plugins.length,
				tables: Object.keys(tableStats).length,
				totalRecords,
				tableStats,
				lastSync: null,
			};
		},

		async query<T = any>(sql: string): Promise<T[]> {
			console.log('Executing SQL query:', sql);
			
			// When we implement this, table names will be pluginId_tableName
			// We can use getSQLiteTableName() to generate them
			
			return [];
		},
	};
}

/**
 * Create executable methods from action definitions for a table
 */
function createMethodsForTable(
	methods: Record<string, any>,
	tableContext: BaseTableMethods<any>
): Record<string, (...args: any[]) => any> {
	const executableMethods: Record<string, any> = {};
	
	for (const [methodName, methodDef] of Object.entries(methods)) {
		if (!methodDef || typeof methodDef !== 'object') continue;
		
		// Create an executable function from the method definition
		executableMethods[methodName] = async (input: unknown) => {
			// Validate input if schema is provided
			if (methodDef.input && methodDef.input['~standard']) {
				input = await validateWithSchema(methodDef.input, input);
			}
			
			// Execute the handler with validated input and context
			return await methodDef.handler(input, tableContext);
		};
	}
	
	return executableMethods;
}

/**
 * Create executable methods from action definitions for a plugin
 */
function createMethodsForPlugin(
	methods: Record<string, any>,
	pluginContext: any
): Record<string, (...args: any[]) => any> {
	const executableMethods: Record<string, any> = {};
	
	for (const [methodName, methodDef] of Object.entries(methods)) {
		if (!methodDef || typeof methodDef !== 'object') continue;
		
		// Create an executable function from the method definition
		executableMethods[methodName] = async (input: unknown) => {
			// Validate input if schema is provided
			if (methodDef.input && methodDef.input['~standard']) {
				input = await validateWithSchema(methodDef.input, input);
			}
			
			// Execute the handler with validated input and context
			return await methodDef.handler(input, pluginContext);
		};
	}
	
	return executableMethods;
}