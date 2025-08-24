import type { PluginConfig, TableConfig } from './plugin';
import type { ActionDefinition, StandardSchemaV1 } from './actions';

// Field type definitions
export type FieldType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'date'
	| 'object'
	| 'string[]'
	| 'number[]'
	| 'boolean[]';

export type FieldDefinition = {
	type: FieldType;
	required?: boolean;
	default?: any;
	unique?: boolean;
	references?: string; // Foreign key reference
};

export type SchemaDefinition = Record<string, FieldDefinition>;

// Infer TypeScript type from field definition
export type InferFieldType<T extends FieldDefinition> = T['type'] extends 'string'
	? string
	: T['type'] extends 'number'
	? number
	: T['type'] extends 'boolean'
	? boolean
	: T['type'] extends 'date'
	? Date
	: T['type'] extends 'object'
	? Record<string, any>
	: T['type'] extends 'string[]'
	? string[]
	: T['type'] extends 'number[]'
	? number[]
	: T['type'] extends 'boolean[]'
	? boolean[]
	: never;

// Infer record type from schema
export type InferRecord<TSchema extends SchemaDefinition> = {
	id: string;
	content?: string;
} & {
	[K in keyof TSchema as TSchema[K]['required'] extends true ? K : never]: InferFieldType<TSchema[K]>;
} & {
	[K in keyof TSchema as TSchema[K]['required'] extends true ? never : K]?: InferFieldType<TSchema[K]>;
};

// Standard CRUD methods for tables (following the new API pattern)
export type BaseTableMethods<TSchema extends SchemaDefinition> = {
	/**
	 * Get a single record by ID
	 * @example vault.reddit.posts.get({ id: 'post_123' })
	 */
	get(params: { id: string }): Promise<InferRecord<TSchema> | null>;
	
	/**
	 * List all records in the table
	 * @example vault.reddit.posts.list()
	 */
	list(): Promise<InferRecord<TSchema>[]>;
	
	/**
	 * Create a new record
	 * @example vault.reddit.posts.create({ title: 'Hello', content: 'World' })
	 */
	create(record: Omit<InferRecord<TSchema>, 'id'>): Promise<InferRecord<TSchema>>;
	
	/**
	 * Update an existing record
	 * @example vault.reddit.posts.update({ id: 'post_123', title: 'Updated' })
	 */
	update(params: { id: string } & Partial<InferRecord<TSchema>>): Promise<InferRecord<TSchema>>;
	
	/**
	 * Delete a record
	 * @example vault.reddit.posts.delete({ id: 'post_123' })
	 */
	delete(params: { id: string }): Promise<boolean>;
	
	/**
	 * Count records in the table
	 * @example vault.reddit.posts.count()
	 */
	count(): Promise<number>;
	
	/**
	 * Check if a record exists
	 * @example vault.reddit.posts.exists({ id: 'post_123' })
	 */
	exists(params: { id: string }): Promise<boolean>;
};

// Vault configuration
export type VaultConfig<TPlugins extends readonly PluginConfig[]> = {
	/**
	 * Path to the vault directory
	 */
	path: string;
	
	/**
	 * Plugins to load into the vault
	 */
	plugins: TPlugins;
	
	/**
	 * Optional SQLite configuration
	 */
	sqlite?: {
		enabled: boolean;
		path?: string;
		syncInterval?: number;
	};
};

// Core vault methods
export type VaultCoreMethods = {
	/**
	 * Sync all data to SQLite
	 */
	sync(): Promise<void>;
	
	/**
	 * Refresh vault from disk
	 */
	refresh(): Promise<void>;
	
	/**
	 * Export vault data
	 */
	export(format: 'json' | 'sql' | 'markdown'): Promise<string>;
	
	/**
	 * Get vault statistics
	 */
	stats(): Promise<{
		plugins: number;
		tables: number;
		totalRecords: number;
		tableStats: Record<string, number>;
		lastSync: Date | null;
	}>;
	
	/**
	 * Execute SQL query (when SQLite is enabled)
	 */
	query<T = any>(sql: string): Promise<T[]>;
};

// Helper type to extract table methods from plugin
type ExtractTableMethods<
	P extends PluginConfig,
	TName extends keyof P['tables']
> = P['tables'][TName] extends TableConfig
	? P['tables'][TName]['methods'] extends Record<string, ActionDefinition>
		? {
			[K in keyof P['tables'][TName]['methods']]: 
				P['tables'][TName]['methods'][K] extends { input: infer I, handler: (...args: any[]) => infer O }
					? I extends StandardSchemaV1
						? (input: StandardSchemaV1.InferInput<I>) => Promise<O>
						: (input: I) => Promise<O>
					: never
		}
		: {}
	: {};

// Helper type to extract plugin-level methods
type ExtractPluginMethods<P extends PluginConfig> = P['methods'] extends Record<string, ActionDefinition>
	? {
		[K in keyof P['methods']]: 
			P['methods'][K] extends { input: infer I, handler: (...args: any[]) => infer O }
				? I extends StandardSchemaV1
					? (input: StandardSchemaV1.InferInput<I>) => Promise<O>
					: (input: I) => Promise<O>
				: never
	}
	: {};

// Build the type for a single plugin in the vault
export type BuildPluginType<P extends PluginConfig> = {
	[TName in keyof P['tables']]: P['tables'][TName] extends TableConfig
		? BaseTableMethods<P['tables'][TName]['schema']> & ExtractTableMethods<P, TName>
		: never;
} & ExtractPluginMethods<P>;

// Build the complete vault type
export type BuildVaultType<TPlugins extends readonly PluginConfig[]> = VaultCoreMethods & {
	[P in TPlugins[number] as P['id']]: BuildPluginType<P>;
};

// Markdown record type (for storage)
export type MarkdownRecord = {
	id: string;
	frontMatter: Record<string, any>;
	content: string;
	path: string;
};