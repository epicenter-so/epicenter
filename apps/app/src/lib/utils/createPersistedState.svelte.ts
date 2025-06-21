import { trySync } from '@epicenterhq/result';
import type { StandardSchemaV1 } from '@standard-schema/spec';

export function parseJson(value: string) {
	return trySync({
		try: () => JSON.parse(value) as unknown,
		mapError: (error) => ({ name: 'ParseJsonError', error }),
	});
}

const attemptMergeStrategy = async <TSchema extends StandardSchemaV1>({
	key,
	valueFromStorage,
	defaultValue,
	schema,
}: {
	key: string;
	valueFromStorage: unknown;
	defaultValue: StandardSchemaV1.InferOutput<TSchema>;
	schema: TSchema;
	issues: ReadonlyArray<StandardSchemaV1.Issue>;
}): Promise<StandardSchemaV1.InferOutput<TSchema>> => {
	// Attempt to merge the default value with the value from storage if possible
	const defaultValueMergedOldValues = {
		...defaultValue,
		...(valueFromStorage as Record<string, unknown>),
	};

	const parseMergedValuesResultMaybePromise = schema['~standard'].validate(
		defaultValueMergedOldValues,
	);
	const parseMergedValuesResult =
		parseMergedValuesResultMaybePromise instanceof Promise
			? await parseMergedValuesResultMaybePromise
			: parseMergedValuesResultMaybePromise;
	if (parseMergedValuesResult.issues) return defaultValue;

	const updatedValue = parseMergedValuesResult.value;
	return updatedValue;
};

/**
 * Creates a persisted state object tied to local storage, accessible through `.value`
 */
export function createPersistedState<TSchema extends StandardSchemaV1>({
	key,
	schema,
	defaultValue,
	isBrowser = true,
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
	 * If false, disables the use of local storage. In SvelteKit, you set
	 * this to `browser` because local storage doesn't exist in the server
	 * context.
	 *
	 * @example
	 *
	 * ```ts
	 * import { browser } from '$app/environment';
	 * ...
	 * const state = createPersistedState({ ..., disableLocalStorage: !browser })
	 * ...
	 * ```
	 * */
	isBrowser?: boolean;
	/**
	 * Handler for when the value from storage fails schema validation.
	 * Return a valid value to use it and save to storage.
	 * @default `() => defaultValue`
	 */
	resolveParseErrorStrategy?: (params: {
		/** The key used to store the value in local storage. */
		key: string;
		/** The value from storage that failed schema validation. */
		valueFromStorage: unknown;
		/** The default value to use if the value from storage fails schema validation. */
		defaultValue: StandardSchemaV1.InferOutput<TSchema>;
		/** The schema used to validate the value from storage. */
		schema: TSchema;
		/** The error that occurred when parsing the value from storage. */
		issues: ReadonlyArray<StandardSchemaV1.Issue>;
	}) => StandardSchemaV1.InferOutput<TSchema>;
	/**
	 * Handler for when the value from storage is successfully updated.
	 * @default `() => {}`
	 */
	onUpdateSuccess?: (newValue: StandardSchemaV1.InferOutput<TSchema>) => void;
	/**
	 * Handler for when the value from storage fails to update.
	 * @default `() => {}`
	 */
	onUpdateError?: (error: unknown) => void;
	/**
	 * Handler for when the value from storage update is settled.
	 * @default `() => {}`
	 */
	onUpdateSettled?: () => void;
}) {
	let value = $state(defaultValue);

	if (isBrowser) {
		const parseValueFromStorage = async (
			valueFromStorageUnparsed: string | null,
		): Promise<StandardSchemaV1.InferOutput<TSchema>> => {
			const isEmpty = valueFromStorageUnparsed === null;
			if (isEmpty) return defaultValue;

			const { data: valueFromStorageJson, error: parseJsonError } = parseJson(
				valueFromStorageUnparsed,
			);
			if (parseJsonError) return defaultValue;

			const valueFromStorageResultMaybePromise =
				schema['~standard'].validate(valueFromStorageJson);
			const valueFromStorageResult =
				valueFromStorageResultMaybePromise instanceof Promise
					? await valueFromStorageResultMaybePromise
					: valueFromStorageResultMaybePromise;

			if (valueFromStorageResult.issues) {
				const resolvedValue = resolveParseErrorStrategy({
					key,
					valueFromStorage: valueFromStorageJson,
					defaultValue,
					schema,
					issues: valueFromStorageResult.issues,
				});
				return resolvedValue;
			}

			return valueFromStorageResult.value;
		};

		value = parseValueFromStorage(localStorage.getItem(key));
		window.addEventListener('storage', (event: StorageEvent) => {
			if (event.key !== key) return;
			value = parseValueFromStorage(event.newValue);
		});
		window.addEventListener('focus', () => {
			value = parseValueFromStorage(localStorage.getItem(key));
		});
	}

	return {
		get value() {
			return value;
		},
		set value(newValue: StandardSchemaV1.InferInput<TSchema>) {
			value = newValue;
			if (!isBrowser) return;
			try {
				localStorage.setItem(key, JSON.stringify(newValue));
				onUpdateSuccess?.(newValue);
			} catch (error) {
				onUpdateError?.(error);
			} finally {
				onUpdateSettled?.();
			}
		},
	};
}
