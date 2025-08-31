// Core exports
export { definePlugin, defineQuery, defineMutation } from './plugin';
export { defineVault } from './vault';

// Type exports
export type { PluginConfig, TableConfig, MethodDefinition, MethodsDefinition } from './plugin';
export type {
	VaultConfig,
	SchemaDefinition,
	FieldDefinition,
	FieldType,
	BaseTableMethods,
	VaultCoreMethods,
	InferRecord,
	InferFieldType,
	BuildVaultType,
} from './types';

// Utility exports
export * from './utils';

// Example plugins
export { redditPlugin } from './plugins/reddit';
export { tagsPlugin } from './plugins/tags';
export { sentimentPlugin } from './plugins/sentiment';
export { redditAnnotatorPlugin } from './plugins/reddit-annotator';
