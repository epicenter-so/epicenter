import type { Commands } from '../app/src/lib/query/singletons/commands';
declare global {
	interface Window {
		commands: Commands;
		goto: (url: string) => Promise<void>;
	}
}
