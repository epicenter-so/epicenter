import { IS_WINDOWS } from '$lib/constants/platform';
import { Command } from '@tauri-apps/plugin-shell';
import { tryAsync, Err, Ok } from 'wellcrafted/result';
import type { CommandService, ShellCommand } from './types';
import { CommandServiceErr } from './types';

export function createCommandServiceDesktop(): CommandService {
	/**
	 * Create a platform-specific command based on the operating system
	 */
	function createPlatformCommand(command: ShellCommand) {
		return IS_WINDOWS
			? Command.create('cmd', ['/c', command])
			: Command.create('sh', ['-c', command]);
	}

	return {
		async execute(command) {
			const { data, error } = await tryAsync({
				try: async () => {
					const cmd = createPlatformCommand(command);
					const output = await cmd.execute();
					return output;
				},
				mapErr: (error) =>
					CommandServiceErr({
						message: 'Failed to execute command',
						context: { command },
						cause: error,
					}),
			});

			if (error) return Err(error);
			return Ok(data);
		},

		async spawn(command) {
			const { data, error } = await tryAsync({
				try: async () => {
					const cmd = createPlatformCommand(command);
					const child = await cmd.spawn();
					return child;
				},
				mapErr: (error) =>
					CommandServiceErr({
						message: 'Failed to spawn command',
						context: { command },
						cause: error,
					}),
			});

			if (error) return Err(error);
			return Ok(data);
		},
	};
}