import type { PressedKeys } from '$lib/utils/createPressedKeys.svelte';
import { Context } from 'runed';

export const context = {
	pressedKeys: new Context<PressedKeys>('pressedKeys'),
};
