import {
	register as tauriRegister,
	unregister as tauriUnregister,
	unregisterAll as tauriUnregisterAll,
} from '@tauri-apps/plugin-global-shortcut';
import {
	Ok,
	Err,
	type Result,
	tryAsync,
	type TaggedError,
} from '@epicenterhq/result';

type GlobalShortcutServiceError = TaggedError<'GlobalShortcutServiceError'>;

/**
 * A type that represents a global shortcut accelerator.
 *
 * @example
 * ```typescript
 * const accelerator: Accelerator = 'CommandOrControl+P';
 * ```
 *
 * @see https://www.electronjs.org/docs/latest/api/accelerator
 */
type Accelerator = string;

export function createGlobalShortcutManager() {
	const shortcuts = new Map<string, Accelerator>();

	return {
		async register(
			id: string,
			accelerator: Accelerator,
			callback: () => void,
		): Promise<Result<void, GlobalShortcutServiceError>> {
			const { error: unregisterError } = await this.unregister(id);
			if (unregisterError) return Err(unregisterError);

			const { error: registerError } = await tryAsync<
				void,
				GlobalShortcutServiceError
			>({
				try: () =>
					tauriRegister(accelerator, (event) => {
						if (event.state === 'Pressed') {
							callback();
						}
					}),
				mapError: (error) => ({
					name: 'GlobalShortcutServiceError',
					message: 'Error registering global shortcut',
					context: { id, accelerator },
					cause: error,
				}),
			});
			if (registerError) return Err(registerError);

			shortcuts.set(id, accelerator);
			return Ok(undefined);
		},

		async unregister(
			id: string,
		): Promise<Result<void, GlobalShortcutServiceError>> {
			const accelerator = shortcuts.get(id);
			if (!accelerator) return Ok(undefined);

			const { error: unregisterError } = await tryAsync<
				void,
				GlobalShortcutServiceError
			>({
				try: () => tauriUnregister(accelerator),
				mapError: (error) => ({
					name: 'GlobalShortcutServiceError',
					message: 'Error unregistering global shortcut',
					context: { id, accelerator },
					cause: error,
				}),
			});
			if (unregisterError) return Err(unregisterError);
			shortcuts.delete(id);
			return Ok(undefined);
		},

		async unregisterAll(): Promise<Result<void, GlobalShortcutServiceError>> {
			const { error: unregisterAllError } = await tryAsync<
				void,
				GlobalShortcutServiceError
			>({
				try: () => tauriUnregisterAll(),
				mapError: (error) => {
					return {
						name: 'GlobalShortcutServiceError',
						message: 'Error unregistering all global shortcuts',
						context: {},
						cause: error,
					};
				},
			});
			if (unregisterAllError) return Err(unregisterAllError);
			shortcuts.clear();
			return Ok(undefined);
		},
	};
}
