import '@tanstack/svelte-table';
import type { CommandCallbacks } from '$lib/commands';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	interface Window {
		__TAURI_INTERNALS__: Record<string, unknown>;
		commands: CommandCallbacks;
		goto: (url: string) => Promise<void>;
	}
}
