import {
	Err,
	Ok,
	trySync,
	type Result,
	type TaggedError,
} from '@epicenterhq/result';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { on } from 'svelte/events';
import { createSubscriber } from 'svelte/reactivity';

type SyncStandardSchemaV1<Input = unknown, Output = Input> = {
	readonly '~standard': SyncStandardSchemaV1.Props<Input, Output>;
};

namespace SyncStandardSchemaV1 {
	export type Props<Input = unknown, Output = Input> = Omit<
		StandardSchemaV1.Props<Input, Output>,
		'validate'
	> & {
		validate: (value: unknown) => StandardSchemaV1.Result<Output>;
	};
}

const attemptMergeStrategy = async <TSchema extends SyncStandardSchemaV1>({
	key,
	value,
	defaultValue,
	schema,
}: {
	key: string;
	value: unknown;
	defaultValue: StandardSchemaV1.InferOutput<TSchema>;
	schema: TSchema;
	issues: ReadonlyArray<StandardSchemaV1.Issue>;
}): Promise<StandardSchemaV1.InferOutput<TSchema>> => {
	// Attempt to merge the default value with the value from storage if possible
	const defaultValueMergedOldValues = {
		...defaultValue,
		...(value as Record<string, unknown>),
	};

	let result = schema['~standard'].validate(defaultValueMergedOldValues);
	if (result instanceof Promise) result = await result;
	if (result.issues) return defaultValue;
	return result.value;
};

type SchemaError = TaggedError<'SchemaError'>;

/**
 * Creates a persisted state object tied to local storage, accessible through `.value`
 *
 * Features:
 * - Synchronous initialization with immediate access to a valid value
 * - Automatic validation using the provided schema
 * - Cross-tab synchronization via storage events
 * - Graceful error recovery with fallback to default value
 * - Type-safe getter and setter
 *
 * @example
 * ```ts
 * const settings = createPersistedState({
 *   key: 'app-settings',
 *   schema: settingsSchema,
 *   defaultValue: { theme: 'light', notifications: true },
 *   onError: (error) => console.error('Settings error:', error)
 * });
 *
 * // Use in component
 * $effect(() => {
 *   console.log('Current settings:', settings.value);
 * });
 *
 * // Update settings
 * settings.value = { theme: 'dark', notifications: false };
 * ```
 */
export function createPersistedState<TSchema extends SyncStandardSchemaV1>({
	key,
	schema,
	defaultValue,
	resolveParseErrorStrategy = attemptMergeStrategy,
	onUpdateSuccess,
	onUpdateError,
	onUpdateSettled,
}: {
	/** The key used to store the value in local storage. */
	key: string;
	/**
	 * The schema is used to validate the value from local storage
	 * (`defaultValue` will be used if the value from local storage is invalid).
	 * */
	schema: TSchema;
	/**
	 * The default value to use if no value is found in local storage or the value
	 * from local storage fails to pass the schema.
	 * */
	defaultValue: StandardSchemaV1.InferOutput<TSchema>;
	/**
	 * Handler for when the value from storage fails schema validation.
	 * Return a valid value to use it and save to storage.
	 * @default `() => defaultValue`
	 */
	resolveParseErrorStrategy?: (params: {
		/** The key used to store the value in local storage. */
		key: string;
		/** The value from storage that failed schema validation. */
		value: unknown;
		/** The default value to use if the value from storage fails schema validation. */
		defaultValue: StandardSchemaV1.InferOutput<TSchema>;
		/** The schema used to validate the value from storage. */
		schema: TSchema;
		/** The error that occurred when parsing the value from storage. */
		issues: ReadonlyArray<StandardSchemaV1.Issue>;
	}) => StandardSchemaV1.InferOutput<TSchema>;
	/**
	 * Handler for when the value from storage is successfully updated.
	 */
	onUpdateSuccess?: (newValue: StandardSchemaV1.InferOutput<TSchema>) => void;
	/**
	 * Handler for when the value from storage fails to update.
	 */
	onUpdateError?: (error: unknown) => void;
	/**
	 * Handler for when the value from storage update is settled.
	 */
	onUpdateSettled?: () => void;
}) {
	let value = $state(defaultValue);

	const parseValueFromStorage = (
		rawValue: string | null,
	): Result<
		StandardSchemaV1.InferOutput<TSchema>,
		ParseJsonError | SchemaError
	> => {
		const isEmpty = rawValue === null;
		if (isEmpty) return Ok(defaultValue);

		const { data: value, error: parseJsonError } = parseJson(rawValue);
		if (parseJsonError) return Err(parseJsonError);

		const result = schema['~standard'].validate(value);

		if (result.issues) {
			return Err({
				name: 'SchemaError',
				message: 'Schema validation failed',
				context: { value },
				cause: result.issues,
			});
		}
		return Ok(result.value as StandardSchemaV1.InferOutput<TSchema>);
	};

	// 			const resolvedValue = resolveParseErrorStrategy({
	// 	key,
	// 	value: value,
	// 	defaultValue,
	// 	schema,
	// 	issues: result.issues,
	// });
	// return resolvedValue;

	const subscribe = createSubscriber((update) => {
		const storage = on(window, 'storage', (e) => {
			if (e.key !== key) return;
			const { data, error } = parseValueFromStorage(e.newValue);
			if (error) {
			} else {
				value = data;
				update(); // Notify reactive contexts of state change
			}
		});

		const focus = on(window, 'focus', () => {
			const { data, error } = parseValueFromStorage(
				window.localStorage.getItem(key),
			);
			if (error) {
			} else {
				value = data;
				update(); // Notify reactive contexts of state change
			}
		});

		return () => {
			storage();
			focus();
		};
	});

	const { data, error } = parseValueFromStorage(
		window.localStorage.getItem(key),
	);
	if (error) {
	} else {
		value = data;
	}

	return {
		get value() {
			subscribe();
			return value;
		},
		set value(newValue: StandardSchemaV1.InferOutput<TSchema>) {
			value = newValue;
			try {
				window.localStorage.setItem(key, JSON.stringify(newValue));
				onUpdateSuccess?.(newValue);
			} catch (error) {
				onUpdateError?.(error);
			} finally {
				onUpdateSettled?.();
			}
		},
	};
}

type ParseJsonError = TaggedError<'ParseJsonError'>;

function parseJson(value: string) {
	return trySync({
		try: () => JSON.parse(value) as unknown,
		mapError: (error): ParseJsonError => ({
			name: 'ParseJsonError',
			message: 'Failed to parse JSON',
			context: { value },
			cause: error,
		}),
	});
}
