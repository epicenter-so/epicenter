// Core exports
export { definePlugin } from './plugin';
export { defineVault } from './vault';
export { validateWithSchema } from './methods';

// Type exports
export type { PluginConfig, TableConfig } from './plugin';
export type {
	VaultConfig,
	SchemaDefinition,
	FieldDefinition,
	BaseTableMethods,
	VaultCoreMethods,
	InferRecord,
} from './types';
export type {
	QueryMethod,
	MutationMethod,
	Method,
} from './methods';

// Utility exports
export * from './utils';

// Example plugins
export { redditPlugin } from './plugins/reddit';
