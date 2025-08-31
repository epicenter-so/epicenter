import type { SchemaDefinition, BaseTableMethods } from './types';
import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Method definition that properly infers input type from arktype schema
 */
export type MethodDefinition<
	TSchema extends StandardSchemaV1 | undefined = undefined,
	TOutput = unknown
> = {
	type: 'query' | 'mutation';
	input?: TSchema;
	handler: TSchema extends StandardSchemaV1
		? (input: StandardSchemaV1.InferInput<TSchema>, vault?: Record<string, unknown>) => Promise<TOutput> | TOutput
		: () => Promise<TOutput> | TOutput;
};

/**
 * Methods can be nested arbitrarily for organization
 */
export type MethodsDefinition = {
	[key: string]: MethodDefinition | MethodsDefinition;
};

/**
 * Base table context with CRUD operations
 */
export type TableContext<TSchema extends SchemaDefinition> = BaseTableMethods<TSchema>;


/**
 * Table configuration with schema
 */
export type TableConfig<TSchema extends SchemaDefinition = SchemaDefinition> = {
	/**
	 * Schema definition for the table
	 */
	schema: TSchema;
};

/**
 * Plugin configuration for the vault system
 * 
 * Plugins extend the vault with:
 * - Tables (data schemas)
 * - Dependencies (other plugins)
 * - Methods (queries and mutations)
 * - Transform (vault transformation function)
 */
export type PluginConfig<
	TId extends string = string,
	TTables extends Record<string, TableConfig> = Record<string, TableConfig>
> = {
	/**
	 * Unique identifier for the plugin
	 * @example "reddit", "twitter", "github"
	 * 
	 * Must be lowercase and contain only letters, numbers, and underscores
	 */
	id: TId;

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
	 * tables: {
	 *   posts: {
	 *     schema: {
	 *       title: { type: 'string', required: true },
	 *       content: { type: 'string' },
	 *       score: { type: 'number', default: 0 }
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
	 * Dependencies - array of plugins this plugin depends on
	 * These will be available in the transform function
	 * 
	 * @example
	 * ```typescript
	 * dependencies: [redditPlugin, tagsPlugin]
	 * ```
	 */
	dependencies?: readonly PluginConfig[];


	/**
	 * Transform function to extend/modify the vault
	 * Receives vault with dependencies and own base CRUD
	 * Returns the transformed vault
	 * 
	 * @example
	 * ```typescript
	 * transform: (vault) => ({
	 *   ...vault,
	 *   reddit: {
	 *     ...vault.reddit,
	 *     posts: {
	 *       ...vault.reddit.posts,
	 *       getTopPosts: {
	 *         type: 'query',
	 *         input: type({ limit: 'number' }),
	 *         handler: async ({ limit }) => {
	 *           const posts = await vault.reddit.posts.list();
	 *           return posts.sort((a, b) => b.score - a.score).slice(0, limit);
	 *         }
	 *       }
	 *     }
	 *   }
	 * })
	 * ```
	 */
	transform: (vault: Record<string, unknown>) => unknown;
};

/**
 * Get the accumulated vault type from dependencies
 */
export type AccumulatedVault<TDeps extends readonly PluginConfig[]> = 
	TDeps extends readonly [infer First, ...infer Rest]
		? First extends PluginConfig
			? Rest extends readonly PluginConfig[]
				? First extends { transform: (vault: Record<string, unknown>) => infer R }
					? R & AccumulatedVault<Rest>
					: AccumulatedVault<Rest>
				: unknown
			: unknown
		: Record<string, unknown>;

/**
 * Infer the vault shape that a plugin receives in its transform
 * Includes accumulated state from dependencies plus base CRUD for own tables
 */
export type InferPluginVault<
	TId extends string,
	TTables extends Record<string, TableConfig>,
	TDeps extends readonly PluginConfig[] = []
> = AccumulatedVault<TDeps> & {
	[K in TId]: {
		[TName in keyof TTables]: TTables[TName] extends TableConfig<infer TSchema>
			? BaseTableMethods<TSchema>
			: never;
	};
};

/**
 * Define a plugin for the vault system
 * Supports both object methods pattern and transform pattern
 * 
 * @example
 * ```typescript
 * import { type } from 'arktype';
 * 
 * // Transform pattern (recommended for complex plugins)
 * const redditPlugin = definePlugin({
 *   id: 'reddit',
 *   name: 'Reddit Integration',
 *   tables: {
 *     posts: {
 *       schema: {
 *         title: { type: 'string', required: true },
 *         score: { type: 'number', default: 0 }
 *       }
 *     }
 *   },
 *   transform: (vault) => ({
 *     ...vault,
 *     reddit: {
 *       ...vault.reddit,
 *       posts: {
 *         ...vault.reddit.posts,
 *         getTopPosts: {
 *           type: 'query',
 *           input: type({ limit: 'number' }),
 *           handler: async ({ limit }) => {
 *             const posts = await vault.reddit.posts.list();
 *             return posts.sort((a, b) => b.score - a.score).slice(0, limit);
 *           }
 *         }
 *       }
 *     }
 *   })
 * });
 * 
 * // With dependencies
 * const annotatorPlugin = definePlugin({
 *   id: 'annotator',
 *   name: 'Annotator',
 *   dependencies: [redditPlugin, tagsPlugin],
 *   tables: {
 *     annotations: {
 *       schema: {
 *         post_id: { type: 'string', required: true },
 *         tags: { type: 'string[]' }
 *       }
 *     }
 *   },
 *   transform: (vault) => ({
 *     ...vault,
 *     annotator: {
 *       ...vault.annotator,
 *       annotatePost: {
 *         type: 'mutation',
 *         input: type({ postId: 'string' }),
 *         handler: async ({ postId }) => {
 *           const post = await vault.reddit.posts.get({ id: postId });
 *           const tags = await vault.tags.tags.list();
 *           return vault.annotator.annotations.create({
 *             post_id: postId,
 *             tags: matchTags(post, tags)
 *           });
 *         }
 *       }
 *     }
 *   })
 * });
 * ```
 */
/**
 * Helper type to ensure transform is always present
 */
type PluginConfigWithTransform<
	TId extends string,
	TTables extends Record<string, TableConfig>,
	TDeps extends readonly PluginConfig[] = []
> = Omit<PluginConfig<TId, TTables>, 'transform' | 'dependencies'> & {
	dependencies?: TDeps;
	transform: (vault: InferPluginVault<TId, TTables, TDeps>) => unknown;
};

/**
 * Define a query with proper type inference
 */
export function defineQuery<
	TSchema extends StandardSchemaV1,
	TOutput = unknown
>(config: {
	input: TSchema;
	handler: (input: StandardSchemaV1.InferInput<TSchema>) => Promise<TOutput> | TOutput;
}) {
	return {
		type: 'query' as const,
		input: config.input,
		handler: config.handler
	};
}

/**
 * Define a mutation with proper type inference
 */
export function defineMutation<
	TSchema extends StandardSchemaV1,
	TOutput = unknown
>(config: {
	input: TSchema;
	handler: (input: StandardSchemaV1.InferInput<TSchema>) => Promise<TOutput> | TOutput;
}) {
	return {
		type: 'mutation' as const,
		input: config.input,
		handler: config.handler
	};
}

export function definePlugin<
	const TId extends string,
	const TTables extends Record<string, TableConfig>,
	const TDeps extends readonly PluginConfig[] = []
>(
	config: Omit<PluginConfig<TId, TTables>, 'transform' | 'dependencies'> & {
		dependencies?: TDeps;
		transform?: (vault: InferPluginVault<TId, TTables, TDeps>) => unknown;
	}
): PluginConfigWithTransform<TId, TTables, TDeps> {
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

	// Return with default transform if not provided
	return {
		...config,
		dependencies: config.dependencies as TDeps,
		transform: config.transform || ((vault) => vault)
	} as PluginConfigWithTransform<TId, TTables, TDeps>;
}