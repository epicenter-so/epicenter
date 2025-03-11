import { parseJson } from '@repo/shared';
import type { z } from 'zod';

const attemptMergeStrategy = <TSchema extends z.ZodTypeAny>({
	key,
	valueFromStorage,
	defaultValue,
	schema,
}: {
	key: string;
	valueFromStorage: unknown;
	defaultValue: z.infer<TSchema>;
	schema: TSchema;
	error: z.ZodError;
}): z.infer<TSchema> => {
	// Attempt to merge the default value with the value from storage if possible
	const defaultValueMergedOldValues = {
		...defaultValue,
		...(valueFromStorage as Record<string, unknown>),
	};

	const parseMergedValuesResult = schema.safeParse(defaultValueMergedOldValues);
	if (!parseMergedValuesResult.success) return defaultValue;

	const updatedValue = parseMergedValuesResult.data;
	return updatedValue;
};

/**
 * Creates a persisted state object tied to local storage, accessible through `.value`
 */
export function createPersistedState<TSchema extends z.ZodTypeAny>({
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
	defaultValue: z.infer<TSchema>;
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
		defaultValue: z.infer<TSchema>;
		/** The schema used to validate the value from storage. */
		schema: TSchema;
		/** The error that occurred when parsing the value from storage. */
		error: z.ZodError;
	}) => z.infer<TSchema>;
	/**
	 * Handler for when the value from storage is successfully updated.
	 * @default `() => {}`
	 */
	onUpdateSuccess?: (newValue: z.infer<TSchema>) => void;
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
		const parseValueFromStorage = (
			valueFromStorageUnparsed: string | null,
		): z.infer<TSchema> => {
			const isEmpty = valueFromStorageUnparsed === null;
			if (isEmpty) return defaultValue;

			const parseJsonResult = parseJson(valueFromStorageUnparsed);
			if (!parseJsonResult.ok) return defaultValue;
			const valueFromStorageJson = parseJsonResult.data;

			const valueFromStorageResult = schema.safeParse(valueFromStorageJson);
			if (valueFromStorageResult.success) return valueFromStorageResult.data;

			const resolvedValue = resolveParseErrorStrategy({
				key,
				valueFromStorage: valueFromStorageJson,
				defaultValue,
				schema,
				error: valueFromStorageResult.error,
			});

			return resolvedValue;
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
		set value(newValue: z.infer<TSchema>) {
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
