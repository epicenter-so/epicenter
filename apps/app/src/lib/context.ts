import { createPressedKeys } from '$lib/utils/createPressedKeys.svelte';
import { getContext, setContext } from 'svelte';
import { createLocalShortcutManager } from './services/shortcuts';

export function buildCtx() {
	setContext('context', createContext());
}

export function context(): Context {
	return getContext('context');
}

function createContext() {
	const pressedKeys = createPressedKeys();
	return {
		pressedKeys,
		localShortcutManager: createLocalShortcutManager({ pressedKeys }),
	};
}

type Context = ReturnType<typeof createContext>;
