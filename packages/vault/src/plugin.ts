import type { SchemaDefinition, InferRecord } from './types';
import type { Action, StandardSchemaV1 } from './actions';

/**
 * Base table context with CRUD operations
 */
export type TableContext<TRecord> = {
	list(): Promise<TRecord[]>;
	get(id: string): Promise<TRecord | null>;
	create(data: Omit<TRecord, 'id'>): Promise<TRecord>;
	update(id: string, updates: Partial<TRecord>): Promise<TRecord>;
	delete(id: string): Promise<boolean>;
	exists(id: string): Promise<boolean>;
	count(): Promise<number>;
};

/**
 * Plugin context with all tables
 */
export type PluginContext<TTables extends Record<string, TableConfig>> = {
	[K in keyof TTables]: TableContext<InferRecord<TTables[K]['schema']>>;
};

/**
 * Table configuration with schema and methods
 */
export type TableConfig<TSchema extends SchemaDefinition = SchemaDefinition> = {
	/**
	 * Schema definition for the table
	 */
	schema: TSchema;
	
	/**
	 * Table-level methods (queries and mutations)
	 * Context provides access to this table's operations
	 * 
	 * @example
	 * ```typescript
	 * import { type } from 'arktype';
	 * 
	 * methods: {
	 *   getTopPosts: {
	 *     type: 'query',
	 *     input: type({ limit: 'number = 10' }),
	 *     handler: async ({ limit }, context) => {
	 *       const posts = await context.list();
	 *       return posts.sort((a, b) => b.score - a.score).slice(0, limit);
	 *     }
	 *   }
	 * }
	 * ```
	 */
	methods?: Record<string, Action<any, any, TableContext<InferRecord<TSchema>>>>;
};

/**
 * Plugin configuration for the vault system
 * 
 * Plugins extend the vault with:
 * - Tables (data schemas with methods)
 * - Plugin-level methods (operate across tables or provide utilities)
 */
export type PluginConfig<
	TTables extends Record<string, TableConfig> = Record<string, TableConfig>,
> = {
	/**
	 * Unique identifier for the plugin
	 * @example "reddit", "twitter", "github"
	 * 
	 * Must be lowercase and contain only letters, numbers, and underscores
	 */
	id: string;

	/**
	 * Human-readable name for the plugin
	 * @example "Reddit Integration", "Twitter Plugin"
	 */
	name: string;

	/**
	 * Table definitions for this plugin
	 * Each table becomes accessible at vault.pluginId.tableName
	 * 
	 * @example
	 * ```typescript
	 * import { type } from 'arktype';
	 * 
	 * tables: {
	 *   posts: {
	 *     schema: {
	 *       title: { type: 'string', required: true },
	 *       content: { type: 'string' },
	 *       score: { type: 'number', default: 0 }
	 *     },
	 *     methods: {
	 *       getBySubreddit: defineQuery({
	 *         input: type({ subreddit: 'string' }),
	 *         handler: async ({ subreddit }, context) => {
	 *           const posts = await context.list();
	 *           return posts.filter(p => p.subreddit === subreddit);
	 *         }
	 *       })
	 *     }
	 *   },
	 *   comments: {
	 *     schema: {
	 *       body: { type: 'string', required: true },
	 *       post_id: { type: 'string', required: true }
	 *     }
	 *   }
	 * }
	 * ```
	 */
	tables: TTables;

	/**
	 * Plugin-level methods (queries and mutations)
	 * Context provides access to all plugin tables
	 * 
	 * @example
	 * ```typescript
	 * import { type } from 'arktype';
	 * 
	 * methods: {
	 *   exportAll: {
	 *     type: 'query',
	 *     input: type({}),
	 *     handler: async (_, context) => {
	 *       const posts = await context.posts.list();
	 *       const comments = await context.comments.list();
	 *       return { posts, comments };
	 *     }
	 *   },
	 *   importData: {
	 *     type: 'mutation',
	 *     input: type({ data: 'object' }),
	 *     handler: async ({ data }, context) => {
	 *       // Import logic here
	 *       return { success: true };
	 *     }
	 *   }
	 * }
	 * ```
	 */
	methods?: Record<string, Action<any, any, PluginContext<TTables>>>;
};

/**
 * Define a plugin for the vault system
 * 
 * @example
 * ```typescript
 * import { type } from 'arktype';
 * 
 * const redditPlugin = definePlugin({
 *   id: 'reddit',
 *   name: 'Reddit Integration',
 *   tables: {
 *     posts: {
 *       schema: {
 *         title: { type: 'string', required: true },
 *         subreddit: { type: 'string', required: true },
 *         score: { type: 'number', default: 0 }
 *       },
 *       methods: {
 *         getBySubreddit: {
 *           type: 'query',
 *           input: type({ subreddit: 'string' }),
 *           handler: async ({ subreddit }, context) => {
 *             const posts = await context.list();
 *             return posts.filter(p => p.subreddit === subreddit);
 *           }
 *         }
 *       }
 *     },
 *     comments: {
 *       schema: {
 *         body: { type: 'string', required: true },
 *         post_id: { type: 'string', required: true }
 *       }
 *     }
 *   },
 *   methods: {
 *     getStats: {
 *       type: 'query',
 *       input: type({}),
 *       handler: async (_, context) => {
 *         const postCount = await context.posts.count();
 *         const commentCount = await context.comments.count();
 *         return { posts: postCount, comments: commentCount };
 *       }
 *     }
 *   }
 * });
 * ```
 */
export function definePlugin<const TTables extends Record<string, TableConfig>>(
	config: PluginConfig<TTables>,
): PluginConfig<TTables> {
	// Validate plugin ID format
	if (!/^[a-z][a-z0-9_]*$/.test(config.id)) {
		throw new Error(
			`Invalid plugin ID "${config.id}". Must start with lowercase letter and contain only lowercase letters, numbers, and underscores.`
		);
	}

	// Validate table names
	for (const tableName of Object.keys(config.tables)) {
		if (!/^[a-z][a-z0-9_]*$/.test(tableName)) {
			throw new Error(
				`Invalid table name "${tableName}" in plugin "${config.id}". Must start with lowercase letter and contain only lowercase letters, numbers, and underscores.`
			);
		}
	}

	return config;
}