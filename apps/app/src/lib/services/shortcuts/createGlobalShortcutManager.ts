import {
	register as tauriRegister,
	unregister as tauriUnregister,
	unregisterAll as tauriUnregisterAll,
} from '@tauri-apps/plugin-global-shortcut';
import { Ok, Err, type Result, tryAsync } from '@epicenterhq/result';
import { WhisperingError } from '@repo/shared';

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
		): Promise<Result<void, WhisperingError>> {
			const { error: unregisterError } = await this.unregister(id);
			if (unregisterError) return Err(unregisterError);

			const { error: registerError } = await tryAsync({
				try: () => tauriRegister(accelerator, callback),
				mapError: (error) =>
					WhisperingError({
						title: 'Error registering global shortcut',
						description: 'Please make sure it is a valid keyboard shortcut.',
						action: { type: 'more-details', error },
						context: { id, accelerator },
						cause: error,
					}),
			});
			if (registerError) return Err(registerError);

			shortcuts.set(id, accelerator);
			return Ok(undefined);
		},

		async unregister(id: string): Promise<Result<void, WhisperingError>> {
			const accelerator = shortcuts.get(id);
			if (!accelerator) return Ok(undefined);

			const { error: unregisterError } = await tryAsync({
				try: () => tauriUnregister(accelerator),
				mapError: (error) =>
					WhisperingError({
						title: 'Error unregistering global shortcut',
						description: 'The shortcut may have already been unregistered.',
						action: { type: 'more-details', error },
						context: { id, accelerator },
						cause: error,
					}),
			});
			if (unregisterError) return Err(unregisterError);
			shortcuts.delete(id);
			return Ok(undefined);
		},

		async unregisterAll(): Promise<Result<void, WhisperingError>> {
			const { error: unregisterAllError } = await tryAsync({
				try: () => tauriUnregisterAll(),
				mapError: (error) => {
					// Still clear our tracking
					shortcuts.clear();
					return WhisperingError({
						title: 'Error unregistering all global shortcuts',
						description:
							'Some shortcuts may not have been properly unregistered.',
						action: { type: 'more-details', error },
						context: {},
						cause: error,
					});
				},
			});
			if (unregisterAllError) return Err(unregisterAllError);
			shortcuts.clear();
			return Ok(undefined);
		},
	};
}
