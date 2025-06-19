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
import type { ShortcutTriggerState } from './shortcut-trigger-state';

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
	const shortcuts = new Map<
		string,
		{
			on: ShortcutTriggerState;
			accelerator: Accelerator;
			callback: () => void;
		}
	>();

	return {
		async register({
			id,
			accelerator,
			callback,
			on,
		}: {
			id: string;
			accelerator: Accelerator;
			callback: () => void;
			on: ShortcutTriggerState;
		}): Promise<Result<void, GlobalShortcutServiceError>> {
			const { error: unregisterError } = await this.unregister(id);
			if (unregisterError) return Err(unregisterError);

			const { error: registerError } = await tryAsync<
				void,
				GlobalShortcutServiceError
			>({
				try: () =>
					tauriRegister(accelerator, (event) => {
						if (
							event.state === 'Pressed' &&
							(on === 'Pressed' || on === 'Both')
						) {
							callback();
						} else if (
							event.state === 'Released' &&
							(on === 'Released' || on === 'Both')
						) {
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

			shortcuts.set(id, { accelerator, callback, on });
			return Ok(undefined);
		},

		async unregister(
			id: string,
		): Promise<Result<void, GlobalShortcutServiceError>> {
			const shortcut = shortcuts.get(id);
			if (!shortcut) return Ok(undefined);

			const { error: unregisterError } = await tryAsync<
				void,
				GlobalShortcutServiceError
			>({
				try: () => tauriUnregister(shortcut.accelerator),
				mapError: (error) => ({
					name: 'GlobalShortcutServiceError',
					message: 'Error unregistering global shortcut',
					context: { id, shortcut },
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
